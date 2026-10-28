import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { getDocumentationIndex } from "@/lib/documentation";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export default function Sidebar({
  activeSection,
  onSectionChange,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([activeSection])
  );

  const sections = getDocumentationIndex();

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-20 left-4 z-40"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen lg:h-auto w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-out z-40 lg:z-auto overflow-y-auto pt-24 lg:pt-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <nav className="p-6 space-y-2">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => {
                  handleSectionClick(section.id);
                  toggleSection(section.id);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors duration-150 ${
                  activeSection === section.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <span className="text-sm font-medium">{section.title}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    expandedSections.has(section.id) ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
