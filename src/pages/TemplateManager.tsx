
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Template, TemplateTag, SubTemplateTag } from "@/types/template";
import { getAllTemplates, createTemplate, getTemplateById, addTagToTemplate, addSubtagToTag, journeyTypes } from "@/services/templateService";
import { Copy, Check, EyeIcon } from "lucide-react";
import { generateSampleQRString } from "@/utils/qrUtils";

// Import refactored components
import TemplateList from "@/components/template/TemplateList";
import NewTemplateForm from "@/components/template/NewTemplateForm";
import TagForm from "@/components/template/TagForm";
import SubtagForm from "@/components/template/SubtagForm";
import TemplateDetails from "@/components/template/TemplateDetails";

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateJourney, setNewTemplateJourney] = useState<string>("");
  const [sampleQRString, setSampleQRString] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Form state for new tag
  const [newTag, setNewTag] = useState<Partial<TemplateTag>>({
    tagId: 0,
    tagGroup: "",
    contentDesc: "",
    jsonKey: "",
    contentValue: "",
    format: "S",
    minLength: 0,
    maxLength: 0,
    isStatic: "0",
    isDynamic: "0",
    required: "0",
    usage: "",
    valid: "1",
    verifyJson: "0",
    hasChild: "0"
  });
  
  // Form state for new subtag
  const [newSubtag, setNewSubtag] = useState<Partial<SubTemplateTag>>({
    subTagId: 0,
    contentDesc: "",
    jsonKey: "",
    contentValue: "",
    format: "S",
    minLength: 0,
    maxLength: 0,
    required: "0",
    usage: "",
    valid: "1",
    verifyJson: "0",
    hasChild: "0"
  });
  
  // Dialog states
  const [isNewTagDialogOpen, setIsNewTagDialogOpen] = useState(false);
  const [isNewSubtagDialogOpen, setIsNewSubtagDialogOpen] = useState(false);
  const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
  const [currentParentTag, setCurrentParentTag] = useState<number | null>(null);
  const [currentParentSubtag, setCurrentParentSubtag] = useState<number | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await getAllTemplates();
        setTemplates(data);
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast({
          title: "Error",
          description: "Failed to load templates. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, [toast]);

  // Update sample QR string when selected template changes
  useEffect(() => {
    if (selectedTemplate) {
      const sampleQR = generateSampleQRString(selectedTemplate);
      setSampleQRString(sampleQR);
    } else {
      setSampleQRString("");
    }
  }, [selectedTemplate]);

  // Handler for selecting a template
  const handleSelectTemplate = async (templateId: number) => {
    try {
      const templateData = await getTemplateById(templateId);
      if (templateData) {
        setSelectedTemplate(templateData);
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      toast({
        title: "Error",
        description: "Failed to load template details.",
        variant: "destructive"
      });
    }
  };

  // Handler for creating a new template
  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateJourney) {
      toast({
        title: "Missing Information",
        description: "Please provide both template name and journey type.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newTemplate = await createTemplate({
        name: newTemplateName,
        journeyId: newTemplateJourney,
        tags: []
      });
      
      setTemplates([...templates, newTemplate]);
      setSelectedTemplate(newTemplate);
      setIsCreatingNew(false);
      setNewTemplateName("");
      setNewTemplateJourney("");
      
      toast({
        title: "Success",
        description: "Template created successfully."
      });
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create template.",
        variant: "destructive"
      });
    }
  };

  // Handler for adding a new tag to a template
  const handleAddTag = async () => {
    if (!selectedTemplate) return;
    
    if (!newTag.tagGroup || !newTag.contentDesc || !newTag.jsonKey) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the tag.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const tagToAdd = {
        ...newTag,
        templateId: selectedTemplate.id,
        journeyId: selectedTemplate.journeyId
      } as TemplateTag;
      
      await addTagToTemplate(selectedTemplate.id, tagToAdd);
      
      // Refresh template data
      const updatedTemplate = await getTemplateById(selectedTemplate.id);
      if (updatedTemplate) {
        setSelectedTemplate(updatedTemplate);
        
        // Update the templates list as well
        setTemplates(templates.map(t => 
          t.id === updatedTemplate.id ? updatedTemplate : t
        ));
      }
      
      setIsNewTagDialogOpen(false);
      
      // Reset form
      setNewTag({
        tagId: 0,
        tagGroup: "",
        contentDesc: "",
        jsonKey: "",
        contentValue: "",
        format: "S",
        minLength: 0,
        maxLength: 0,
        isStatic: "0",
        isDynamic: "0",
        required: "0",
        usage: "",
        valid: "1",
        verifyJson: "0",
        hasChild: "0"
      });
      
      toast({
        title: "Success",
        description: "Tag added successfully."
      });
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error",
        description: "Failed to add tag to template.",
        variant: "destructive"
      });
    }
  };

  // Handler for adding a new subtag
  const handleAddSubtag = async () => {
    if (!selectedTemplate || currentParentTag === null) return;
    
    if (!newSubtag.contentDesc || !newSubtag.jsonKey) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the subtag.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const subtagToAdd = {
        ...newSubtag,
        templateId: selectedTemplate.id,
        journeyId: selectedTemplate.journeyId
      } as SubTemplateTag;
      
      await addSubtagToTag(
        selectedTemplate.id,
        currentParentTag,
        currentParentSubtag,
        subtagToAdd
      );
      
      // Refresh template data
      const updatedTemplate = await getTemplateById(selectedTemplate.id);
      if (updatedTemplate) {
        setSelectedTemplate(updatedTemplate);
        
        // Update the templates list as well
        setTemplates(templates.map(t => 
          t.id === updatedTemplate.id ? updatedTemplate : t
        ));
      }
      
      setIsNewSubtagDialogOpen(false);
      
      // Reset form
      setNewSubtag({
        subTagId: 0,
        contentDesc: "",
        jsonKey: "",
        contentValue: "",
        format: "S",
        minLength: 0,
        maxLength: 0,
        required: "0",
        usage: "",
        valid: "1",
        verifyJson: "0",
        hasChild: "0"
      });
      
      toast({
        title: "Success",
        description: "Subtag added successfully."
      });
    } catch (error) {
      console.error("Error adding subtag:", error);
      toast({
        title: "Error",
        description: "Failed to add subtag.",
        variant: "destructive"
      });
    }
  };

  // Function to open the Add Subtag dialog
  const openAddSubtagDialog = (tagId: number, subtagId: number | null = null) => {
    setCurrentParentTag(tagId);
    setCurrentParentSubtag(subtagId);
    setIsNewSubtagDialogOpen(true);
  };
  
  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({
        title: "Copied!",
        description: "Sample QR string copied to clipboard."
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-brand-primary">QR Code Template Manager</h1>
          <Button 
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white"
          >
            {isCreatingNew ? 'Cancel' : 'Create New Template'}
          </Button>
        </div>

        {isCreatingNew && (
          <NewTemplateForm
            newTemplateName={newTemplateName}
            newTemplateJourney={newTemplateJourney}
            setNewTemplateName={setNewTemplateName}
            setNewTemplateJourney={setNewTemplateJourney}
            handleCreateTemplate={handleCreateTemplate}
            journeyTypes={journeyTypes}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Template List */}
          <TemplateList 
            templates={templates}
            isLoading={isLoading}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleSelectTemplate}
          />

          {/* Template Details */}
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
      </div>

      {/* New Tag Dialog */}
      <Dialog open={isNewTagDialogOpen} onOpenChange={setIsNewTagDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-brand-primary">Add New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag for your template. Tags define the structure of your QR code.
            </DialogDescription>
          </DialogHeader>
          
          <TagForm 
            tag={newTag}
            setTag={setNewTag}
            onSubmit={handleAddTag}
            onCancel={() => setIsNewTagDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* New Subtag Dialog */}
      <Dialog open={isNewSubtagDialogOpen} onOpenChange={setIsNewSubtagDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-brand-primary">Add New Subtag</DialogTitle>
            <DialogDescription>
              Create a new subtag for your template tag. Subtags help define nested structures.
            </DialogDescription>
          </DialogHeader>
          
          <SubtagForm
            subtag={newSubtag}
            setSubtag={setNewSubtag}
            onSubmit={handleAddSubtag}
            onCancel={() => setIsNewSubtagDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* QR Preview Dialog */}
      <Dialog open={isQrPreviewOpen} onOpenChange={setIsQrPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-brand-primary flex items-center">
              <EyeIcon className="mr-2 h-5 w-5" />
              Sample QR String Preview
            </DialogTitle>
            <DialogDescription>
              This is a sample QR string based on the current template structure. You can use this for testing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-brand-primary">Generated Structure</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(sampleQRString)}
                className="text-brand-primary border-brand-primary/30 hover:bg-brand-primary/10"
              >
                {copySuccess ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy
              </Button>
            </div>
            <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-sm font-mono">
              {sampleQRString}
            </pre>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setIsQrPreviewOpen(false)}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManager;
