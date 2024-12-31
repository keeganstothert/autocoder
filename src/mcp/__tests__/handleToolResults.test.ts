import { describe, it, expect, vi, beforeEach } from 'vitest';
import handleToolResults from '../handleToolResults';
import handleToolUse from '../handleToolUse';
import type { Mcp } from '../../types';
import type { ToolUseBlock } from '@anthropic-ai/sdk/resources/index.mjs';

// Mock dependencies
vi.mock('../handleToolUse');

describe('handleToolResults', () => {
  let mockMcp: Mcp;
  let mockMessages: any[];
  let mockToolUseBlocks: ToolUseBlock[];

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create mock Mcp object
    mockMcp = {
      anthropic: {
        messages: {
          create: vi.fn(),
        },
      },
      availableTools: [],
    } as unknown as Mcp;

    // Set environment variables
    process.env.MODEL = 'claude-3';
    process.env.MAX_TOKENS = '4096';

    // Initialize mock messages array
    mockMessages = [
      { role: 'user', content: 'initial message' },
    ];

    // Initialize mock tool use blocks
    mockToolUseBlocks = [
      {
        type: 'tool_use',
        id: 'tool1',
        tool: { name: 'test_tool' },
        parameters: {},
      },
    ] as unknown as ToolUseBlock[];
  });

  it('should process a single tool use block successfully', async () => {
    const mockToolResult = { result: 'success' };
    const mockResponse = {
      content: [{ type: 'text', text: 'response' }],
    };

    // Setup mocks
    (handleToolUse as any).mockResolvedValueOnce(mockToolResult);
    mockMcp.anthropic.messages.create.mockResolvedValueOnce(mockResponse);

    // Execute
    const result = await handleToolResults(mockMcp, mockToolUseBlocks, mockMessages);

    // Verify
    expect(handleToolUse).toHaveBeenCalledWith(mockMcp, mockToolUseBlocks[0]);
    expect(mockMcp.anthropic.messages.create).toHaveBeenCalledWith({
      model: 'claude-3',
      max_tokens: 4096,
      messages: [
        ...mockMessages,
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 'tool1',
              content: JSON.stringify(mockToolResult),
            },
          ],
        },
      ],
      tools: [],
    });
    expect(result).toBe(mockResponse);
  });

  it('should process multiple tool use blocks in sequence', async () => {
    const multipleToolUseBlocks = [
      { type: 'tool_use', id: 'tool1', tool: { name: 'test_tool1' }, parameters: {} },
      { type: 'tool_use', id: 'tool2', tool: { name: 'test_tool2' }, parameters: {} },
    ] as unknown as ToolUseBlock[];

    const mockToolResults = [
      { result: 'success1' },
      { result: 'success2' },
    ];
    const mockResponses = [
      { content: [{ type: 'text', text: 'response1' }] },
      { content: [{ type: 'text', text: 'response2' }] },
    ];

    // Setup mocks
    (handleToolUse as any)
      .mockResolvedValueOnce(mockToolResults[0])
      .mockResolvedValueOnce(mockToolResults[1]);
    
    mockMcp.anthropic.messages.create
      .mockResolvedValueOnce(mockResponses[0])
      .mockResolvedValueOnce(mockResponses[1]);

    // Execute
    const result = await handleToolResults(mockMcp, multipleToolUseBlocks, mockMessages);

    // Verify
    expect(handleToolUse).toHaveBeenCalledTimes(2);
    expect(mockMcp.anthropic.messages.create).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponses[1]);
    expect(mockMessages).toHaveLength(5); // Initial + 2 tool results + 2 responses
  });

  it('should throw an error if no response is received', async () => {
    // Setup empty tool use blocks array
    const emptyToolUseBlocks: ToolUseBlock[] = [];

    // Execute and verify
    await expect(handleToolResults(mockMcp, emptyToolUseBlocks, mockMessages))
      .rejects
      .toThrow('No response received from tool use processing');
  });

  it('should handle tool use errors gracefully', async () => {
    // Setup mock to throw error
    (handleToolUse as any).mockRejectedValueOnce(new Error('Tool use failed'));

    // Execute and verify
    await expect(handleToolResults(mockMcp, mockToolUseBlocks, mockMessages))
      .rejects
      .toThrow('Tool use failed');
  });

  it('should maintain conversation context through multiple tools', async () => {
    const mockToolResult = { result: 'success' };
    const mockResponse = {
      content: [{ type: 'text', text: 'response' }],
    };

    // Setup mocks
    (handleToolUse as any).mockResolvedValueOnce(mockToolResult);
    mockMcp.anthropic.messages.create.mockResolvedValueOnce(mockResponse);

    // Execute
    await handleToolResults(mockMcp, mockToolUseBlocks, mockMessages);

    // Verify message history is maintained correctly
    expect(mockMessages).toHaveLength(3); // Initial + tool result + response
    expect(mockMessages[0]).toEqual({ role: 'user', content: 'initial message' });
    expect(mockMessages[1].role).toBe('user');
    expect(mockMessages[1].content[0].type).toBe('tool_result');
    expect(mockMessages[2]).toEqual({ role: 'assistant', content: mockResponse.content });
  });
});