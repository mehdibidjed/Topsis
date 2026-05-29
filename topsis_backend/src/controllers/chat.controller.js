import fetch from 'node-fetch';
import getLocationsInPolygon from '../services/spacial.service.js';
import runTopsis from '../services/topsis.service.js';

const SYSTEM_PROMPT = `You are the GeoTOPSIS AI Agent, an expert spatial decision-support advisor. 

Your objective is to help the user configure Multi-Criteria Decision Analysis (TOPSIS) weights to find the optimal geographic locations for solar farm installations (or similar projects) in the Oran region. 

The system uses 5 spatial criteria:
1. Wind (Vent): Measured in m/s. High wind can be good for wind farms, but for solar it might affect structural integrity.
2. Slope (Pente): Flatter land is generally better for solar panel installation and maintenance.
3. Habitations (Proximity to population): Typically, solar farms should avoid dense residential clusters.
4. Exposition (Sun exposure): South-facing is crucial for solar gain.
5. Altitude (Elevation): Higher elevations might have clearer skies.

Behavioral Guidelines:
- Keep your answers VERY short, concise, and structured. Use Markdown formatting.
- Be friendly, professional, and directly address the user's questions about how to set weights (percentages).
- You HAVE TOOLS TO HELP THE USER. 
- You can get the current TOPSIS results the user is looking at.
- You can simulate new weights internally.
- IMPORTANT: If the user explicitly asks you to select, pick, or apply weights based on their ideas, you MUST use the apply_weights_to_ui tool. After calling apply_weights_to_ui, tell the user the weights have been applied to their screen!`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_current_topsis_results",
      description: "Get the user's current TOPSIS spatial analysis results based on their selected map polygon and weights. Returns the top 5 locations.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "simulate_weights",
      description: "Simulate a new TOPSIS run internally with new weights over the user's current polygon. Returns the top 5 locations.",
      parameters: {
        type: "object",
        properties: {
          wind: { type: "number", description: "Percentage weight for wind (0-100)" },
          slope: { type: "number", description: "Percentage weight for slope (0-100)" },
          habitations: { type: "number", description: "Percentage weight for habitations (0-100)" },
          exposure: { type: "number", description: "Percentage weight for exposure (0-100)" },
          altitude: { type: "number", description: "Percentage weight for altitude (0-100)" }
        },
        required: ["wind", "slope", "habitations", "exposure", "altitude"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "apply_weights_to_ui",
      description: "Automatically apply a specific set of weights to the user's interface when they ask you to select or apply weights for them.",
      parameters: {
        type: "object",
        properties: {
          wind: { type: "number", description: "Percentage weight for wind (0-100)" },
          slope: { type: "number", description: "Percentage weight for slope (0-100)" },
          habitations: { type: "number", description: "Percentage weight for habitations (0-100)" },
          exposure: { type: "number", description: "Percentage weight for exposure (0-100)" },
          altitude: { type: "number", description: "Percentage weight for altitude (0-100)" }
        },
        required: ["wind", "slope", "habitations", "exposure", "altitude"]
      }
    }
  }
];

export const handleChat = async (req, res) => {
    try {
        const { messages, appContext } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, message: 'Messages array is required.' });
        }

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                success: false, 
                message: 'DEEPSEEK_API_KEY is missing from the server environment. Please define it in the backend .env file.' 
            });
        }

        // DeepSeek expects tool messages with tool_calls, so if frontend sent previous ai messages that included tool_calls, 
        // we might need to handle them, but since frontend doesn't store tool_calls, we only append them in memory during THIS loop.
        
        const apiMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(msg => ({ 
                role: msg.role === 'ai' ? 'assistant' : 'user', 
                content: msg.content 
            }))
        ];

        let action = null;
        let aiMessage = null;
        let currentMessages = [...apiMessages];

        // Agent loop (max 3 turns)
        for (let i = 0; i < 3; i++) {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: currentMessages,
                    tools: tools,
                    tool_choice: "auto",
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('DeepSeek API Error:', errorData);
                return res.status(response.status).json({ success: false, message: 'DeepSeek API connection filed.' });
            }

            const data = await response.json();
            const responseMessage = data.choices[0].message;
            currentMessages.push(responseMessage);

            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                for (const toolCall of responseMessage.tool_calls) {
                    const funcName = toolCall.function.name;
                    let args = {};
                    try {
                        args = JSON.parse(toolCall.function.arguments || "{}");
                    } catch(e) {}
                    
                    let functionResult = "";

                    if (!appContext || !appContext.polygon) {
                        functionResult = JSON.stringify({ error: "No map area selected. Ask the user to draw a polygon on the map first." });
                    } else if (funcName === 'get_current_topsis_results') {
                        if (appContext.results && appContext.results.length > 0) {
                            const top5 = appContext.results.slice(0, 5).map((r, rank) => ({
                                rank: rank + 1, 
                                score: r.score, 
                                attributes: { vent: r.vent, pente: r.pente, habitations: r.habitations, exposition: r.exposition, altitude: r.altitude }
                            }));
                            functionResult = JSON.stringify({ top_locations: top5 });
                        } else {
                            functionResult = JSON.stringify({ error: "No results currently. The user might need to run analysis first." });
                        }
                    } else if (funcName === 'simulate_weights') {
                        const types = ["benefit", "cost", "cost", "benefit", "benefit"];
                        const simWeights = [
                            args.wind || 20, 
                            args.slope || 20, 
                            args.habitations || 20, 
                            args.exposure || 20, 
                            args.altitude || 20
                        ];
                        const sum = simWeights.reduce((a, b) => a + b, 0) || 1;
                        const w = simWeights.map(v => v / sum);

                        try {
                            const locations = await getLocationsInPolygon(appContext.polygon);
                            if (locations.length === 0) {
                                functionResult = JSON.stringify({ error: "No locations found in area." });
                            } else {
                                const results = runTopsis(locations, w, types);
                                results.sort((a,b) => b.score - a.score);
                                const top5 = results.slice(0, 5).map((r, rank) => ({ rank: rank + 1, score: r.score }));
                                functionResult = JSON.stringify({ success: true, simulated_top_locations: top5 });
                            }
                        } catch (err) {
                            functionResult = JSON.stringify({ error: err.message });
                        }
                    } else if (funcName === 'apply_weights_to_ui') {
                        action = {
                            type: 'apply_weights',
                            weights: {
                                wind: args.wind || 20,
                                slope: args.slope || 20,
                                habitations: args.habitations || 20,
                                exposure: args.exposure || 20,
                                altitude: args.altitude || 20
                            },
                            run: true
                        };
                        functionResult = JSON.stringify({ success: true, message: "Weights applied triggered on the UI! Inform the user." });
                    }

                    currentMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: funcName,
                        content: functionResult
                    });
                }
            } else {
                aiMessage = responseMessage.content;
                break;
            }
        }

        res.json({ success: true, answer: aiMessage, action: action });

    } catch (error) {
        console.error('Chat controller error:', error);
        res.status(500).json({ success: false, message: 'An internal server error occurred while processing the chat.' });
    }
};
