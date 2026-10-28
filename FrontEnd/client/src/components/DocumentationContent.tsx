import { getSection } from "@/lib/documentation";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DocumentationContentProps {
  sectionId: string;
}

export default function DocumentationContent({
  sectionId,
}: DocumentationContentProps) {
  const section = getSection(sectionId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!section) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Section not found.</p>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderContent = (content: string) => {
    const lines = content.split("\n");
    let inList = false;
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    lines.forEach((line, idx) => {
      if (line.startsWith("- ")) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(line.substring(2));
      } else {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${idx}`} className="list-disc list-inside mb-4 space-y-1 ml-2">
              {listItems.map((item, i) => (
                <li key={i} className="text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          );
          inList = false;
          listItems = [];
        }

        if (line.startsWith("**") && line.endsWith("**")) {
          elements.push(
            <strong key={idx} className="block mt-5 mb-3 text-lg text-foreground font-semibold">
              {line.replace(/\*\*/g, "")}
            </strong>
          );
        } else if (line.trim() === "") {
          elements.push(<div key={idx} className="h-3" />);
        } else if (line.trim()) {
          elements.push(
            <p key={idx} className="mb-3 text-foreground leading-relaxed">
              {line}
            </p>
          );
        }
      }
    });

    if (inList && listItems.length > 0) {
      elements.push(
        <ul key="final-list" className="list-disc list-inside mb-4 space-y-1 ml-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-foreground">
              {item}
            </li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  return (
    <main className="flex-1 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Section Header */}
        <div className="mb-12 doc-section">
          <h1 className="mb-4">{section.title}</h1>
          {section.description && (
            <p className="text-lg text-muted-foreground">
              {section.description}
            </p>
          )}
        </div>

        {/* Subsections */}
        <div className="space-y-12">
          {section.subsections.map((subsection) => (
            <div key={subsection.id} className="doc-subsection scroll-mt-20" id={subsection.id}>
              <h2 className="mb-4">{subsection.title}</h2>

              {/* Content with code block support */}
              <div className="space-y-4">
                {subsection.content.includes("```") ? (
                  subsection.content.split("```").map((block, idx) => {
                    if (idx % 2 === 0) {
                      return (
                        <div key={idx} className="text-foreground">
                          {renderContent(block)}
                        </div>
                      );
                    } else {
                      const [lang, ...codeLines] = block.split("\n");
                      const code = codeLines.join("\n").trim();
                      return (
                        <div key={idx} className="relative my-6 group">
                          <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() => handleCopy(code, subsection.id)}
                            >
                              {copiedId === subsection.id ? (
                                <>
                                  <Check size={14} className="text-green-500 mr-1" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={14} className="mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto border border-border">
                            <code className="text-sm font-mono text-foreground">
                              {code}
                            </code>
                          </pre>
                        </div>
                      );
                    }
                  })
                ) : (
                  <div className="text-foreground">
                    {renderContent(subsection.content)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Table of Contents for current section */}
        {section.subsections.length > 1 && (
          <div className="mt-16 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">On this page</h3>
            <nav className="space-y-1">
              {section.subsections.map((subsection) => (
                <a
                  key={subsection.id}
                  href={`#${subsection.id}`}
                  className="block px-3 py-2 text-sm text-primary hover:bg-muted rounded-md transition-colors duration-150"
                >
                  {subsection.title}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </main>
  );
}
