import { NextRequest, NextResponse } from "next/server";
import { getStyleById } from "@/lib/style-matcher";

export const runtime = "nodejs";

// HairCLIP — basic tier (free). Fixed enum of hairstyle descriptions.
const HAIRCLIP_VERSION =
  "b95cb2a16763bea87ed7ed851d5a3ab2f4655e94bcfb871edba029d4814fa587";

// SDXL LoRA trained on Black male hairstyles — premium tier.
// Supports img2img: uses the user's selfie as input with a text prompt.
const SDXL_BLACK_HAIRSTYLES_VERSION =
  "1294c57ea49537c6805c42d29eb44d54c980ba4958afd8198b3ba4137d063e12";

type ModelTier = "basic" | "refined";

/**
 * POST /api/visualize
 *
 * Generates an AI try-on visualization of a selected style on the
 * user's photo. Supports two model tiers:
 *
 * - basic:  HairCLIP (free). Fixed enum hairstyles, research-grade.
 * - refined: SDXL LoRA trained on Black male hairstyles (premium).
 *            img2img mode, higher quality, preserves facial features.
 *
 * Request body:
 * {
 *   image: string,       // base64 data URL
 *   styleId: string,     // style ID from data/styles.json
 *   tier?: string,       // "basic" | "refined" (default: "basic")
 *   shade?: string,      // "dark" | "regular" | "light"
 *   color?: string,      // hair color (default: "black")
 * }
 *
 * Response:
 * {
 *   id: string,          // Replicate prediction ID
 *   status: string,      // prediction status
 *   output: string|null  // output image URL when complete
 *   tier: string,        // which model was used
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { image, styleId, tier, shade, color } = await request.json();

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

    const modelTier: ModelTier = tier === "refined" ? "refined" : "basic";
    const shadeDesc = shade || "regular";
    const colorDesc = color || "black";

    let replicateBody: Record<string, unknown>;
    let version: string;

    if (modelTier === "refined") {
      // Premium: SDXL LoRA trained on Black male hairstyles, img2img mode.
      // Uses the user's selfie as input and applies the hairstyle via prompt.
      version = SDXL_BLACK_HAIRSTYLES_VERSION;
      replicateBody = {
        version,
        input: {
          image,
          prompt: `a black man with a ${style.name.toLowerCase()} haircut, ${style.replicatePrompt}, ${shadeDesc} ${colorDesc} hair, professional portrait photo, studio lighting, high quality, detailed face`,
          prompt_strength: 0.8,
          num_inference_steps: 30,
          lora_scale: 0.7,
          guidance_scale: 7.5,
          disable_safety_checker: true,
        },
      };
    } else {
      // Basic: HairCLIP with fixed enum hairstyle descriptions.
      version = HAIRCLIP_VERSION;
      replicateBody = {
        version,
        input: {
          image,
          editing_type: "both",
          hairstyle_description: style.replicatePrompt,
          color_description: `${shadeDesc} ${colorDesc}`,
        },
      };
    }

    // Create Replicate prediction
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token " + process.env.REPLICATE_API_TOKEN,
      },
      body: JSON.stringify(replicateBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error:", response.status, errorText);
      let clientError = "Failed to create visualization";
      if (response.status === 401) {
        clientError = "Replicate API token is invalid or expired";
      } else if (response.status === 429) {
        clientError = "Rate limited by Replicate — please wait a moment and try again";
      } else if (response.status === 400 || response.status === 422) {
        clientError = "Invalid input — the hairstyle prompt or image was rejected by the AI model";
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
      tier: modelTier,
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
