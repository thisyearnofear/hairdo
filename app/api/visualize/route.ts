import { NextRequest, NextResponse } from "next/server";
import { getStyleById } from "@/lib/style-matcher";

export const runtime = "nodejs";

const REPLICATE_MODEL_VERSION =
  "b95cb2a16763bea87ed7ed851d5a3ab2f4655e94bcfb871edba029d4814fa587";

/**
 * POST /api/visualize
 *
 * Generates an AI try-on visualization of a selected style on the
 * user's photo. Calls Replicate's HairCLIP model.
 *
 * Request body:
 * {
 *   image: string,       // base64 data URL
 *   styleId: string,     // style ID from data/styles.json
 *   shade?: string,      // "dark" | "regular" | "light" (default: "regular")
 *   color?: string,      // hair color (default: "black")
 * }
 *
 * Response:
 * {
 *   id: string,          // Replicate prediction ID
 *   status: string,      // prediction status
 *   output: string|null  // output image URL when complete
 * }
 *
 * During development this endpoint is free. In production it will be
 * gated by x402 payment on Lisk mainnet.
 */
export async function POST(request: NextRequest) {
  try {
    const { image, styleId, shade, color } = await request.json();

    // Validate image
    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Image is required (base64 data URL)" },
        { status: 400 }
      );
    }

    // Validate style
    if (!styleId || typeof styleId !== "string") {
      return NextResponse.json(
        { error: "styleId is required" },
        { status: 400 }
      );
    }

    const style = getStyleById(styleId);
    if (!style) {
      return NextResponse.json(
        { error: `Style not found: ${styleId}` },
        { status: 404 }
      );
    }

    const shadeDesc = shade || "regular";
    const colorDesc = color || "black";

    // Create Replicate prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + process.env.REPLICATE_API_TOKEN,
      },
      body: JSON.stringify({
        version: REPLICATE_MODEL_VERSION,
        input: {
          image,
          editing_type: "both",
          hairstyle_description: style.replicatePrompt,
          color_description: `${shadeDesc} ${colorDesc}`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error:", response.status, errorText);
      // Return a more helpful error to the client
      let clientError = "Failed to create visualization";
      if (response.status === 401) {
        clientError = "Replicate API token is invalid or expired";
      } else if (response.status === 429) {
        clientError = "Rate limited by Replicate — please wait a moment and try again";
      } else if (response.status === 400) {
        clientError = "Invalid input — the image may be too large or in the wrong format";
      }
      return NextResponse.json(
        { error: clientError, details: errorText.slice(0, 500) },
        { status: 502 }
      );
    }

    const json = await response.json();

    return NextResponse.json({
      id: json.id,
      status: json.status,
      output: json.output,
      style: {
        id: style.id,
        name: style.name,
        replicatePrompt: style.replicatePrompt,
      },
    });
  } catch (e) {
    console.error("Visualize API error:", e);
    return NextResponse.json(
      { error: "Failed to create visualization" },
      { status: 500 }
    );
  }
}
