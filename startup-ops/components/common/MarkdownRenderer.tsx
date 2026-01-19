"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Copy,
    Check,
    Download,
    FileCode,
    Table as TableIcon
} from "lucide-react";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Enhanced markdown renderer for chat messages with action buttons.
 * Supports: bold, bullet points, numbered lists, headers, tables with copy,
 * code blocks with copy/download, and inline code.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {

    // Copy to clipboard helper
    const copyToClipboard = async (text: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    };

    // Download file helper
    const downloadFile = (content: string, filename: string, type: string = "text/plain") => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Code Block Component with actions
    const CodeBlock = ({ code, language }: { code: string; language: string }) => {
        const [copied, setCopied] = useState(false);

        const handleCopy = async () => {
            if (await copyToClipboard(code)) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        };

        const handleDownload = () => {
            const ext = getFileExtension(language);
            downloadFile(code, `code.${ext}`, "text/plain");
        };

        const getFileExtension = (lang: string): string => {
            const extensions: Record<string, string> = {
                javascript: "js", typescript: "ts", python: "py", java: "java",
                cpp: "cpp", c: "c", csharp: "cs", go: "go", rust: "rs",
                ruby: "rb", php: "php", swift: "swift", kotlin: "kt",
                html: "html", css: "css", json: "json", yaml: "yaml",
                sql: "sql", bash: "sh", shell: "sh", markdown: "md"
            };
            return extensions[lang.toLowerCase()] || "txt";
        };

        return (
            <div className="relative group my-3 rounded-lg overflow-hidden border border-border">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
                    <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-mono">
                            {language || "code"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Copy code"
                        >
                            {copied ? <Check className="w-4 h-4 text-foreground" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Download code"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {/* Code */}
                <pre className="bg-muted p-4 overflow-x-auto">
                    <code className="text-sm text-foreground font-mono whitespace-pre">
                        {code}
                    </code>
                </pre>
            </div>
        );
    };

    // Table Component with actions
    const TableBlock = ({ header, rows }: { header: string[]; rows: string[][] }) => {
        const [copied, setCopied] = useState(false);

        const getTableAsCSV = (): string => {
            const headerRow = header.map(h => `"${h.trim()}"`).join(",");
            const dataRows = rows.map(row =>
                row.map(cell => `"${cell.trim()}"`).join(",")
            ).join("\n");
            return `${headerRow}\n${dataRows}`;
        };

        const handleCopy = async () => {
            if (await copyToClipboard(getTableAsCSV())) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        };

        const handleDownload = () => {
            downloadFile(getTableAsCSV(), "table.csv", "text/csv");
        };

        return (
            <div className="relative group my-3">
                {/* Actions */}
                <div className="absolute -top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                        title="Copy as CSV"
                    >
                        {copied ? <Check className="w-3 h-3 text-foreground" /> : <Copy className="w-3 h-3" />}
                        CSV
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-1.5 rounded-md bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                        title="Download CSV"
                    >
                        <Download className="w-3 h-3" />
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="min-w-full text-sm">
                        {header.length > 0 && (
                            <thead className="bg-muted">
                                <tr>
                                    {header.map((cell, i) => (
                                        <th key={i} className="px-3 py-2 text-left font-medium text-foreground border-b border-border">
                                            {renderInline(cell.trim())}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                        )}
                        <tbody>
                            {rows.map((row, rowI) => (
                                <tr key={rowI} className={rowI % 2 === 0 ? "bg-card" : "bg-muted/50"}>
                                    {row.map((cell, cellI) => (
                                        <td key={cellI} className="px-3 py-2 text-foreground/80 border-b border-border">
                                            {renderInline(cell.trim())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderMarkdown = (text: string) => {
        const lines = text.split("\n");
        const elements: React.ReactNode[] = [];
        let inCodeBlock = false;
        let codeBlockContent: string[] = [];
        let codeBlockLang = "";
        let inTable = false;
        let tableRows: string[][] = [];
        let tableHeader: string[] = [];
        let listItems: { type: "ul" | "ol"; items: string[] } | null = null;

        const flushList = () => {
            if (listItems) {
                if (listItems.type === "ul") {
                    elements.push(
                        <ul key={elements.length} className="list-disc list-inside space-y-1 my-2 ml-2">
                            {listItems.items.map((item, i) => (
                                <li key={i} className="text-foreground">{renderInline(item)}</li>
                            ))}
                        </ul>
                    );
                } else {
                    elements.push(
                        <ol key={elements.length} className="list-decimal list-inside space-y-1 my-2 ml-2">
                            {listItems.items.map((item, i) => (
                                <li key={i} className="text-foreground">{renderInline(item)}</li>
                            ))}
                        </ol>
                    );
                }
                listItems = null;
            }
        };

        const flushTable = () => {
            if (inTable && (tableRows.length > 0 || tableHeader.length > 0)) {
                elements.push(
                    <TableBlock key={elements.length} header={tableHeader} rows={tableRows} />
                );
                tableRows = [];
                tableHeader = [];
                inTable = false;
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code block handling
            if (line.startsWith("```")) {
                if (inCodeBlock) {
                    elements.push(
                        <CodeBlock key={elements.length} code={codeBlockContent.join("\n")} language={codeBlockLang} />
                    );
                    inCodeBlock = false;
                    codeBlockContent = [];
                } else {
                    flushList();
                    flushTable();
                    inCodeBlock = true;
                    codeBlockLang = line.slice(3).trim();
                }
                continue;
            }

            if (inCodeBlock) {
                codeBlockContent.push(line);
                continue;
            }

            // Table handling
            if (line.includes("|") && line.trim().startsWith("|")) {
                flushList();
                const cells = line.split("|").filter(c => c.trim() !== "");

                if (cells.every(c => c.trim().match(/^[-:]+$/))) {
                    continue;
                }

                if (!inTable) {
                    inTable = true;
                    tableHeader = cells;
                } else {
                    tableRows.push(cells);
                }
                continue;
            } else if (inTable) {
                flushTable();
            }

            // Headers
            if (line.startsWith("### ")) {
                flushList();
                elements.push(
                    <h4 key={elements.length} className="text-sm font-semibold text-foreground mt-3 mb-1">
                        {renderInline(line.slice(4))}
                    </h4>
                );
                continue;
            }
            if (line.startsWith("## ")) {
                flushList();
                elements.push(
                    <h3 key={elements.length} className="text-base font-semibold text-foreground mt-4 mb-2">
                        {renderInline(line.slice(3))}
                    </h3>
                );
                continue;
            }
            if (line.startsWith("# ")) {
                flushList();
                elements.push(
                    <h2 key={elements.length} className="text-lg font-bold text-foreground mt-4 mb-2">
                        {renderInline(line.slice(2))}
                    </h2>
                );
                continue;
            }

            // Unordered list
            const ulMatch = line.match(/^[\s]*[-•*]\s+(.+)/);
            if (ulMatch) {
                if (!listItems || listItems.type !== "ul") {
                    flushList();
                    listItems = { type: "ul", items: [] };
                }
                listItems.items.push(ulMatch[1]);
                continue;
            }

            // Ordered list
            const olMatch = line.match(/^[\s]*(\d+)[.)]\s+(.+)/);
            if (olMatch) {
                if (!listItems || listItems.type !== "ol") {
                    flushList();
                    listItems = { type: "ol", items: [] };
                }
                listItems.items.push(olMatch[2]);
                continue;
            }

            // Regular paragraph
            flushList();
            if (line.trim()) {
                elements.push(
                    <p key={elements.length} className="text-foreground my-1 leading-relaxed">
                        {renderInline(line)}
                    </p>
                );
            } else if (elements.length > 0) {
                elements.push(<div key={elements.length} className="h-2" />);
            }
        }

        flushList();
        flushTable();

        return elements;
    };

    const renderInline = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let key = 0;

        while (remaining.length > 0) {
            // Bold: **text**
            const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
            if (boldMatch && boldMatch.index !== undefined) {
                if (boldMatch.index > 0) {
                    parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
                }
                parts.push(<strong key={key++} className="font-semibold text-foreground">{boldMatch[1]}</strong>);
                remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
                continue;
            }

            // Inline code: `code`
            const codeMatch = remaining.match(/`([^`]+)`/);
            if (codeMatch && codeMatch.index !== undefined) {
                if (codeMatch.index > 0) {
                    parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
                }
                parts.push(
                    <code key={key++} className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono text-foreground">
                        {codeMatch[1]}
                    </code>
                );
                remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
                continue;
            }

            parts.push(<span key={key++}>{remaining}</span>);
            break;
        }

        return parts.length === 1 ? parts[0] : <>{parts}</>;
    };

    return (
        <div className={cn("markdown-content", className)}>
            {renderMarkdown(content)}
        </div>
    );
}
