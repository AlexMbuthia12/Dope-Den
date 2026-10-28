import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DocumentationContent from "@/components/DocumentationContent";
import { getDocumentationIndex, getAllSubsections } from "@/lib/documentation";

export default function Home() {
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSections, setFilteredSections] = useState<string[]>([]);

  const sections = getDocumentationIndex();
  const allSubsections = getAllSubsections();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSections([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matching = new Set<string>();

    // Search in section titles
    sections.forEach((section) => {
      if (section.title.toLowerCase().includes(query)) {
        matching.add(section.id);
      }
    });

    // Search in subsection titles and content
    allSubsections.forEach((subsection) => {
      if (
        subsection.title.toLowerCase().includes(query) ||
        subsection.sectionTitle.toLowerCase().includes(query)
      ) {
        matching.add(subsection.sectionId);
      }
    });

    setFilteredSections(Array.from(matching));
  }, [searchQuery, sections, allSubsections]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && filteredSections.length > 0) {
      setActiveSection(filteredSections[0]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header onSearch={handleSearch} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <div className="flex-1 overflow-y-auto">
          <DocumentationContent sectionId={activeSection} />
        </div>
      </div>
    </div>
  );
}
