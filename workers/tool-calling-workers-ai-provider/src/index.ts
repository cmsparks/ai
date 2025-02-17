import { Hono } from "hono";
import { cors } from "hono/cors";
import { generateText, tool } from "ai";
import z from "zod";
import { createWorkersAI } from "workers-ai-provider";
import type { Env } from "./types/env.ts";
import type { Variables } from "./types/hono.ts";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.use(cors());

app.post("/", async (c) => {
	const { prompt } = (await c.req.json()) as { prompt: string };
	const workersai = createWorkersAI({ binding: c.env.AI });

	const result = await generateText({
		model: workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
		messages: [
			{ role: "system", content: "You are a helpful AI assistant" },
			{ role: "user", content: prompt },
		],
		tools: {
			weather: tool({
				description: "Get the weather in a location",
				parameters: z.object({
					location: z.string().describe("The location to get the weather for"),
				}),
				execute: async ({ location }) => ({
					location,
					weather: location === "London" ? "Raining" : "Sunny",
				}),
			}),
		},
	});

	return c.json(result);
});

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
