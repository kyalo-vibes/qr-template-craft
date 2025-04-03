import React, { useState, useEffect } from 'react';
import { Header } from "@/components/Header";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Template, TemplateTag, SubTemplateTag } from "@/types/template";
import { getAllTemplates, createTemplate, addTagToTemplate, addSubtagToTemplate } from "@/services/templateService";
import { generateSampleQRString } from "@/utils/qrUtils";

// Import components
import TemplateList from "@/components/template/TemplateList";
import TemplateDetails from "@/components/template/TemplateDetails";
import TemplateHeaderActions from "@/components/template/TemplateHeaderActions";
import NewTemplateForm from "@/components/template/NewTemplateForm";
import TagForm from "@/components/template/TagForm";
import SubtagForm from "@/components/template/SubtagForm";
import QrPreviewDialog from "@/components/template/QrPreviewDialog";

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [isNewTagDialogOpen, setIsNewTagDialogOpen] = useState(false);
  const [isAddSubtagDialogOpen, setIsAddSubtagDialogOpen] = useState(false);
  const [selectedParentTagId, setSelectedParentTagId] = useState<number | null>(null);
  const [selectedParentSubtagId, setSelectedParentSubtagId] = useState<number | null>(null);
  const [sampleQRString, setSampleQRString] = useState<string>('{}');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Generate sample QR string when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      const qrString = generateSampleQRString(selectedTemplate);
      setSampleQRString(qrString);
      
      // Generate QR code preview URL
      // In a real implementation, this would call the actual QR code generation API
      setQrPreviewUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`);
    }
  }, [selectedTemplate]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await getAllTemplates();
      setTemplates(data);
      
      // Select the first template by default if available
      if (data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (id: number) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setSelectedTemplate(template);
    }
  };

  const handleCreateTemplate = async (name: string, journeyId: string) => {
    try {
      const newTemplate = await createTemplate(name, journeyId);
      setTemplates(prev => [...prev, newTemplate]);
      setSelectedTemplate(newTemplate);
      setIsNewTemplateDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const handleAddTag = async (tag: Partial<TemplateTag>) => {
    if (!selectedTemplate) return;
    
    try {
      const updatedTemplate = await addTagToTemplate(selectedTemplate.id, tag);
      
      // Update templates list and selected template
      setTemplates(prev => 
        prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
      );
      setSelectedTemplate(updatedTemplate);
      setIsNewTagDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Tag added successfully",
      });
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    }
  };

  const openAddSubtagDialog = (tagId: number, subtagId?: number | null) => {
    setSelectedParentTagId(tagId);
    setSelectedParentSubtagId(subtagId || null);
    setIsAddSubtagDialogOpen(true);
  };

  const handleAddSubtag = async (subtag: Partial<SubTemplateTag>) => {
    if (!selectedTemplate || selectedParentTagId === null) return;
    
    try {
      const updatedTemplate = await addSubtagToTemplate(
        selectedTemplate.id, 
        selectedParentTagId,
        selectedParentSubtagId,
        subtag
      );
      
      // Update templates list and selected template
      setTemplates(prev => 
        prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
      );
      setSelectedTemplate(updatedTemplate);
      setIsAddSubtagDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Subtag added successfully",
      });
    } catch (error) {
      console.error("Error adding subtag:", error);
      toast({
        title: "Error",
        description: "Failed to add subtag",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({
        title: "Copied!",
        description: "QR string copied to clipboard.",
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-brand-primary">Template Manager</h1>
          <TemplateHeaderActions 
            setIsNewTemplateDialogOpen={setIsNewTemplateDialogOpen}
          />
        </div>
        
        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList className="bg-brand-primary/10">
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-brand-primary data-[state=active]:text-white"
            >
              Templates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TemplateList 
                templates={templates}
                isLoading={isLoading}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={handleSelectTemplate}
              />
              
              <TemplateDetails 
                selectedTemplate={selectedTemplate}
                sampleQRString={sampleQRString}
                copySuccess={copySuccess}
                copyToClipboard={copyToClipboard}
                setIsNewTagDialogOpen={setIsNewTagDialogOpen}
                openAddSubtagDialog={openAddSubtagDialog}
                setIsQrPreviewOpen={setIsQrPreviewOpen}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialogs */}
      <Dialog open={isNewTemplateDialogOpen} onOpenChange={setIsNewTemplateDialogOpen}>
        <NewTemplateForm onSubmit={handleCreateTemplate} />
      </Dialog>
      
      <Dialog open={isNewTagDialogOpen} onOpenChange={setIsNewTagDialogOpen}>
        <TagForm onSubmit={handleAddTag} />
      </Dialog>
      
      <Dialog open={isAddSubtagDialogOpen} onOpenChange={setIsAddSubtagDialogOpen}>
        <SubtagForm 
          onSubmit={handleAddSubtag}
          parentTagId={selectedParentTagId}
          parentSubtagId={selectedParentSubtagId}
        />
      </Dialog>
      
      <QrPreviewDialog 
        isOpen={isQrPreviewOpen}
        setIsOpen={setIsQrPreviewOpen}
        qrPreviewUrl={qrPreviewUrl}
        selectedTemplateName={selectedTemplate?.name || null}
      />
    </div>
  );
};

export default TemplateManager;
