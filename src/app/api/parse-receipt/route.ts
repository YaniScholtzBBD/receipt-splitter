import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

import { VAT_PERCENT } from "@/lib/format";
import { RECEIPT_PARSING_PROMPT } from "@/lib/prompts";
import type { ParsedReceipt } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic();

type ParseRequest = {
  image: string;
  mediaType?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Confirm the request belongs to a logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "You must sign in first.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const {
      image,
      mediaType = "image/jpeg",
    } = (await request.json()) as ParseRequest;

    if (!image) {
      return NextResponse.json(
        {
          error: "No receipt image was provided.",
        },
        {
          status: 400,
        },
      );
    }

    const response =
      await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,

        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type:
                    mediaType as
                      | "image/jpeg"
                      | "image/png"
                      | "image/gif"
                      | "image/webp",
                  data: image,
                },
              },
              {
                type: "text",
                text: RECEIPT_PARSING_PROMPT,
              },
            ],
          },
        ],
      });

    const textBlock = response.content[0];

    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        {
          error:
            "The receipt parser returned an unexpected response.",
        },
        {
          status: 500,
        },
      );
    }

    const cleaned = textBlock.text
      .replace(/```json\n?/g, "")
      .replace(/```/g, "")
      .trim();

    let receipt: ParsedReceipt;

    try {
      receipt = JSON.parse(
        cleaned,
      ) as ParsedReceipt;
    } catch {
      console.error(
        "Invalid receipt JSON:",
        cleaned,
      );

      return NextResponse.json(
        {
          error:
            "The receipt could not be converted into valid data.",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !Array.isArray(receipt.items) ||
      receipt.items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No receipt items could be identified.",
        },
        {
          status: 422,
        },
      );
    }

    const calculatedSubtotal =
      receipt.items.reduce(
        (sum, item) => sum + item.price,
        0,
      );

    const subtotal =
      receipt.subtotal ?? calculatedSubtotal;

    const vatPercent = VAT_PERCENT;
    const vat = subtotal * vatPercent / (100 + vatPercent);

    const serviceCharge =
      receipt.service_charge ?? 0;

    const total =
      receipt.total ??
      subtotal + serviceCharge; 

    // Create the split
    const {
      data: split,
      error: splitError,
    } = await supabase
      .from("splits")
      .insert({
        user_id: user.id,
        restaurant_name:
          receipt.restaurant_name,
        bill_subtotal: subtotal,
        bill_vat: vat,
        bill_service_charge: serviceCharge,
        bill_total: total,
        tip_percent: 10,
        adjustment: 0,
      })
      .select()
      .single();

    if (splitError || !split) {
      console.error(
        "Create split failed:",
        splitError,
      );

      return NextResponse.json(
        {
          error:
            splitError?.message ??
            "The split could not be created.",
        },
        {
          status: 400,
        },
      );
    }

    const itemRows = receipt.items.map(
      (item, position) => ({
        split_id: split.id,
        name: item.name,
        price: item.price,
        claimed_by: [],
        position,
      }),
    );

    const { error: itemsError } =
      await supabase
        .from("items")
        .insert(itemRows);

    if (itemsError) {
      // Remove the incomplete split
      await supabase
        .from("splits")
        .delete()
        .eq("id", split.id);

      console.error(
        "Create items failed:",
        itemsError,
      );

      return NextResponse.json(
        {
          error: itemsError.message,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json({
      success: true,
      splitId: split.id,
    });
  } catch (error) {
    console.error(
      "Parse receipt error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse the receipt.",
      },
      {
        status: 500,
      },
    );
  }
}