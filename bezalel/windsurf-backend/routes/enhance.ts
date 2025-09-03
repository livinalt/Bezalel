import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function POST(req: NextRequest) {
  const { image, prompt } = await req.json();
  try {
    const output = await replicate.run(
      "jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786e9257117c67b3c96d1384b61c82c01c5f83e",
      {
        input: {
          image,
          prompt:
            prompt ||
            "Enhance sketch to detailed artwork, vibrant colors, clean lines",
        },
      }
    );
    return NextResponse.json({ enhancedImage: output });
  } catch (error) {
    return NextResponse.json(
      { error: "AI enhancement failed" },
      { status: 500 }
    );
  }
}
