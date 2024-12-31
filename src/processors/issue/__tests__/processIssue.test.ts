import { describe, it, expect, vi, beforeEach } from 'vitest';
import processIssue from '../processIssue';
import getInitialPrompt from '../getInitialPrompt';
import handleToolResults from '../../../mcp/handleToolResults';
import type { Mcp } from '../../../types';

// Mock dependencies
vi.mock('../getInitialPrompt');
vi.mock('../../../mcp/handleToolResults');

describe('processIssue', () => {
  let mockMcp: Mcp;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a mock Mcp object
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
  });

  it('should process an issue with no tool uses', async () => {
    const issueNumber = '123';
    const mockInitialPrompt = 'test prompt';
    const mockResponse = {
      content: [{ type: 'text', text: 'test response' }],
    };

    // Setup mocks
    (getInitialPrompt as any).mockReturnValue(mockInitialPrompt);
    mockMcp.anthropic.messages.create.mockResolvedValue(mockResponse);

    // Execute
    const result = await processIssue(mockMcp, issueNumber);

    // Verify
    expect(getInitialPrompt).toHaveBeenCalledWith(issueNumber);
    expect(mockMcp.anthropic.messages.create).toHaveBeenCalledWith({
      model: 'claude-3',
      max_tokens: 4096,
      messages: [{ role: 'user', content: mockInitialPrompt }],
      tools: [],
    });
    expect(result).toEqual([
      { role: 'user', content: mockInitialPrompt },
      { role: 'assistant', content: mockResponse.content },
    ]);
  });

  it('should process an issue with tool uses', async () => {
    const issueNumber = '123';
    const mockInitialPrompt = 'test prompt';
    const mockToolUseResponse = {
      content: [
        { type: 'tool_use', id: 'tool1', tool: { name: 'test_tool' }, parameters: {} },
      ],
    };
    const mockFinalResponse = {
      content: [{ type: 'text', text: 'final response' }],
    };

    // Setup mocks
    (getInitialPrompt as any).mockReturnValue(mockInitialPrompt);
    mockMcp.anthropic.messages.create.mockResolvedValueOnce(mockToolUseResponse);
    (handleToolResults as any).mockResolvedValueOnce(mockFinalResponse);

    // Execute
    const result = await processIssue(mockMcp, issueNumber);

    // Verify
    expect(getInitialPrompt).toHaveBeenCalledWith(issueNumber);
    expect(mockMcp.anthropic.messages.create).toHaveBeenCalledWith({
      model: 'claude-3',
      max_tokens: 4096,
      messages: [{ role: 'user', content: mockInitialPrompt }],
      tools: [],
    });
    expect(handleToolResults).toHaveBeenCalledWith(
      mockMcp,
      mockToolUseResponse.content,
      [
        { role: 'user', content: mockInitialPrompt },
      ]
    );
    expect(result).toEqual([
      { role: 'user', content: mockInitialPrompt },
      { role: 'assistant', content: mockFinalResponse.content },
    ]);
  });

  it('should handle multiple tool use iterations', async () => {
    const issueNumber = '123';
    const mockInitialPrompt = 'test prompt';
    const mockToolUseResponse1 = {
      content: [
        { type: 'tool_use', id: 'tool1', tool: { name: 'test_tool' }, parameters: {} },
      ],
    };
    const mockToolUseResponse2 = {
      content: [
        { type: 'tool_use', id: 'tool2', tool: { name: 'test_tool' }, parameters: {} },
      ],
    };
    const mockFinalResponse = {
      content: [{ type: 'text', text: 'final response' }],
    };

    // Setup mocks
    (getInitialPrompt as any).mockReturnValue(mockInitialPrompt);
    mockMcp.anthropic.messages.create.mockResolvedValueOnce(mockToolUseResponse1);
    (handleToolResults as any)
      .mockResolvedValueOnce(mockToolUseResponse2)
      .mockResolvedValueOnce(mockFinalResponse);

    // Execute
    const result = await processIssue(mockMcp, issueNumber);

    // Verify
    expect(handleToolResults).toHaveBeenCalledTimes(2);
    expect(result[result.length - 1]).toEqual({
      role: 'assistant',
      content: mockFinalResponse.content,
    });
  });
});