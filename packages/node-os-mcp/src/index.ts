
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { server } from "./server";
export { server };

// Start the server
async function main() {
  const args = process.argv.slice(2);
  const type = args.at(0) || "stdio";
  if (type === "sse") {
    const app = express();
    const connections = new Map<string, SSEServerTransport>();
    
    // Add middleware for parsing JSON bodies
    app.use(express.json());
    
    // Add CORS headers
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    app.get("/sse", async (req, res) => {
      console.error("SSE connection established");
      try {
        const connectionId = Math.random().toString(36).substring(7);
        const transport = new SSEServerTransport("/messages", res);
        connections.set(connectionId, transport);
        
        // Clean up connection when it closes
        res.on('close', () => {
          console.error("SSE connection closed");
          connections.delete(connectionId);
        });
        
        res.on('error', (error) => {
          console.error("SSE connection error:", error);
          connections.delete(connectionId);
        });
        
        await server.connect(transport);
      } catch (error) {
        console.error("Error establishing SSE connection:", error);
        if (!res.headersSent) {
          res.status(500).send("Internal Server Error");
        }
      }
    });
    
    app.post("/messages", async (req, res) => {
      console.error("Received message:", req.body);
      try {
        // For simplicity, use the most recent connection
        // In a production app, you'd want to route to the correct connection
        const transports = Array.from(connections.values());
        if (transports.length > 0) {
          const transport = transports[transports.length - 1];
          await transport.handlePostMessage(req, res);
        } else {
          res.status(400).json({ error: "No active SSE connections" });
        }
      } catch (error) {
        console.error("Error handling POST message:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal Server Error" });
        }
      }
    });
    
    const port = process.env.PORT || 3001;
    const server_instance = app.listen(port, () => {
      console.error(`MCP Server running on SSE at http://localhost:${port}`);
    });
    
    server_instance.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please stop other processes or use a different port.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
      }
    });
    
    console.error("MCP Server running on sse");
  } else if (type === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server running on stdio");
  } else {
    throw new Error(`Unknown transport type: ${type}`);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});