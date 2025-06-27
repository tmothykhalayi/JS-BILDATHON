import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as os from "os";

// Create a new instance of the MCP server
const server = new McpServer({
    name: "node-os-mcp",
    description: "A server that provides tools to get information about the operating system.",
    version: "0.0.1",
});

// Define a cpu_average_usage tool that returns the average CPU usage of the system
server.tool(
  "cpu_average_usage",
  "Get the average CPU usage percentage on the local machine",
  {},
  async () => {
    // Calculate average CPU usage over 100ms
    function cpuAverage() {
      const cpus = os.cpus();
      let totalIdle = 0, totalTick = 0;

      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
      }
      return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
    }

    const start = cpuAverage();
    await new Promise(res => setTimeout(res, 100));
    const end = cpuAverage();

    const idleDiff = end.idle - start.idle;
    const totalDiff = end.total - start.total;
    const usage = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;

    return {
      content: [{
        type: "text",
        text: `Average CPU usage: ${usage.toFixed(2)}%`
      }],
      isError: false
    };
  }
);

// Define a get_hostname tool that returns the hostname of the system
server.tool(
  "get_hostname",
  "Get the hostname of the local machine",
  {},
  async () => ({
    content: [{
      type: "text",
      text: `Hostname: ${os.hostname()}`
    }],
    isError: false
  })
);

// Define a get_architecture tool that returns the architecture of the system
server.tool(
  "get_architecture",
  "Get the architecture of the local machine",
  {},
  async () => ({
    content: [{
      type: "text",
      text: `Architecture: ${os.arch()}`
    }],
    isError: false
  })
);

// Define a get_uptime tool that returns the uptime of the system
server.tool(
  "get_uptime",
  "Get the uptime of the local machine in seconds",
  {},
  async () => ({
    content: [{
      type: "text",
      text: `Uptime: ${os.uptime()} seconds`
    }],
    isError: false
  })
);

// Export the server instance to use it in the index.ts file
export { server };
