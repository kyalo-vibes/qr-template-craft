
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  PlusCircle, 
  Save, 
  Trash2, 
  Edit, 
  ArrowDown, 
  FileCode, 
  Tag, 
  Info, 
  Copy,
  Check,
  EyeIcon
} from "lucide-react";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Template, TemplateTag, SubTemplateTag } from "@/types/template";
import { getAllTemplates, createTemplate, getTemplateById, addTagToTemplate, addSubtagToTag, journeyTypes } from "@/services/templateService";

// Sample QR code generator based on template structure
const generateSampleQRString = (template: Template): string => {
  // Initialize an object structure
  let qrObject: any = {};
  
  // Process main tags
  template.tags.forEach(tag => {
    // Skip if no json key
    if (!tag.jsonKey) return;
    
    let value = tag.contentValue;
    
    // If no static value, generate a placeholder based on format type
    if (!value) {
      if (tag.format === 'N') {
        value = '123456';
      } else if (tag.format === 'A') {
        value = 'ABC123';
      } else {
        value = 'Sample';
      }
    }
    
    // If tag has children, create a nested object
    if (tag.hasChild === '1' && tag.subtags && tag.subtags.length > 0) {
      const nestedObj = processSubtags(tag.subtags);
      qrObject[tag.jsonKey] = nestedObj;
    } else {
      qrObject[tag.jsonKey] = value;
    }
  });
  
  return JSON.stringify(qrObject, null, 2);
};

// Helper to process subtags recursively
const processSubtags = (subtags: SubTemplateTag[]): any => {
  if (!subtags || subtags.length === 0) return {};
  
  let result: any = {};
  
  subtags.forEach(subtag => {
    if (!subtag.jsonKey) return;
    
    let value = subtag.contentValue;
    
    // Generate placeholder value if needed
    if (!value) {
      if (subtag.format === 'N') {
        value = '123456';
      } else if (subtag.format === 'A') {
        value = 'ABC123';
      } else {
        value = 'Sample';
      }
    }
    
    // Handle nested subtags
    if (subtag.hasChild === '1' && subtag.subtags && subtag.subtags.length > 0) {
      result[subtag.jsonKey] = processSubtags(subtag.subtags);
    } else {
      result[subtag.jsonKey] = value;
    }
  });
  
  return result;
};

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

  // Render subtags recursively
  const renderSubtags = (subtags: SubTemplateTag[] | undefined, level: number = 1) => {
    if (!subtags || subtags.length === 0) return null;
    
    return (
      <div className={`ml-${level * 4}`}>
        {subtags.map(subtag => (
          <div key={subtag.subTagSequence} className="border-l-2 border-brand-primary/30 pl-4 my-2">
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center">
                <span className="tag-id-badge mr-2">{subtag.subTagId}</span>
                <div>
                  <span className="font-semibold">{subtag.contentDesc}</span>
                  <span className="ml-2 text-sm text-gray-600">({subtag.jsonKey})</span>
                  {subtag.contentValue && (
                    <span className="ml-2 text-sm text-blue-600">= {subtag.contentValue}</span>
                  )}
                  <div className="flex mt-1 space-x-1">
                    <span className={`tag-pill ${subtag.required === '1' ? 'tag-required' : 'tag-optional'}`}>
                      {subtag.required === '1' ? 'Required' : 'Optional'}
                    </span>
                    <span className={`tag-pill ${subtag.verifyJson === '1' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                      {subtag.verifyJson === '1' ? 'Verify JSON' : 'No Verification'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openAddSubtagDialog(
                    subtag.parentTemplateTagId || 0, 
                    subtag.subTagSequence
                  )}
                  className="text-brand-primary border-brand-primary/30 hover:bg-brand-primary/10"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Child
                </Button>
              </div>
            </div>
            {renderSubtags(subtag.subtags, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-brand-primary">QR Code Template Manager</h1>
          <Button 
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="btn-primary"
          >
            {isCreatingNew ? 'Cancel' : 'Create New Template'}
          </Button>
        </div>

        {isCreatingNew && (
          <Card className="mb-6 border-brand-primary border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-brand-primary">Create New Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input 
                      id="template-name" 
                      placeholder="Enter template name" 
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="journey-type">Journey Type</Label>
                    <Select 
                      value={newTemplateJourney} 
                      onValueChange={setNewTemplateJourney}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select a journey type" />
                      </SelectTrigger>
                      <SelectContent>
                        {journeyTypes.map(journey => (
                          <SelectItem key={journey.id} value={journey.id}>
                            {journey.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCreateTemplate}
                    className="btn-primary"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Template List */}
          <Card className="md:col-span-1 h-fit shadow-sm">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-brand-primary flex items-center">
                <FileCode className="mr-2 h-5 w-5" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="text-center py-4">Loading templates...</div>
              ) : templates.length > 0 ? (
                <ul className="space-y-2">
                  {templates.map(template => (
                    <li key={template.id}>
                      <Button
                        variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                        className={`w-full justify-start ${selectedTemplate?.id === template.id ? 'bg-brand-primary' : 'border-brand-primary/30 hover:bg-brand-primary/10 text-brand-primary'}`}
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        <span className="truncate">{template.name}</span>
                        <span className="ml-auto px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {template.journeyId}
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-md">
                  <FileCode className="h-10 w-10 opacity-30 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No templates found. Create a new template to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Details */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="flex justify-between items-center">
                <span className="text-brand-primary">
                  {selectedTemplate ? selectedTemplate.name : 'Template Details'}
                </span>
                {selectedTemplate && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsQrPreviewOpen(true)}
                    className="text-brand-primary border-brand-primary/30 hover:bg-brand-primary/10"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Preview QR
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!selectedTemplate ? (
                <div className="text-center py-12 text-gray-500 border border-dashed rounded-md">
                  <Tag className="h-10 w-10 opacity-30 mx-auto mb-3" />
                  <p>Select a template to view its details or create a new one.</p>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Journey Type:</span>
                      <span className="ml-2">{selectedTemplate.journeyId}</span>
                    </div>
                    <Button 
                      onClick={() => setIsNewTagDialogOpen(true)}
                      className="btn-primary"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Tag
                    </Button>
                  </div>
                  
                  {/* Sample QR String Preview */}
                  <div className="mb-4 border rounded-md p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-brand-primary flex items-center">
                        <QrCode className="mr-2 h-4 w-4" />
                        Sample QR Data
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(sampleQRString)}
                        className="text-brand-primary hover:text-brand-primary/80"
                      >
                        {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <pre className="sample-qr-box whitespace-pre-wrap text-xs">
                      {sampleQRString}
                    </pre>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-brand-primary flex items-center">
                      <Tag className="mr-2 h-5 w-5" />
                      Tags
                    </h3>
                    
                    {selectedTemplate.tags.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <Tag className="h-10 w-10 opacity-30 mx-auto mb-3" />
                        <p className="text-gray-500">No tags defined. Add your first tag to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedTemplate.tags.map(tag => (
                          <div key={tag.tagId} className="border rounded-md p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start">
                                <span className="tag-id-badge mr-3 flex-shrink-0 mt-1">{tag.tagId}</span>
                                <div>
                                  <h4 className="font-medium">{tag.contentDesc}</h4>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <div>
                                      <span className="font-medium">Group:</span> {tag.tagGroup}
                                    </div>
                                    <div>
                                      <span className="font-medium">JSON Key:</span> {tag.jsonKey}
                                    </div>
                                    {tag.contentValue && (
                                      <div>
                                        <span className="font-medium">Value:</span> {tag.contentValue}
                                      </div>
                                    )}
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <span className={`tag-pill ${tag.isStatic === '1' ? 'tag-static' : tag.isDynamic === '1' ? 'tag-dynamic' : 'bg-gray-100 text-gray-800'}`}>
                                        {tag.isStatic === '1' ? 'Static' : tag.isDynamic === '1' ? 'Dynamic' : 'Undefined'}
                                      </span>
                                      <span className={`tag-pill ${tag.required === '1' ? 'tag-required' : 'tag-optional'}`}>
                                        {tag.required === '1' ? 'Required' : 'Optional'}
                                      </span>
                                      <span className={`tag-pill ${tag.verifyJson === '1' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {tag.verifyJson === '1' ? 'Verify JSON' : 'No Verification'}
                                      </span>
                                      <span className={`tag-pill ${tag.hasChild === '1' ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-gray-100 text-gray-800'}`}>
                                        {tag.hasChild === '1' ? 'Has Children' : 'No Children'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openAddSubtagDialog(tag.tagId)}
                                  className="text-brand-primary border-brand-primary/30 hover:bg-brand-primary/10"
                                >
                                  <PlusCircle className="h-4 w-4 mr-1" />
                                  Add Subtag
                                </Button>
                              </div>
                            </div>
                            
                            {/* Render subtags */}
                            {tag.subtags && tag.subtags.length > 0 && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium mb-2 text-brand-secondary">Subtags</h5>
                                {renderSubtags(tag.subtags)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tag-group">Tag Group</Label>
                <Input 
                  id="tag-group" 
                  placeholder="e.g., Header, Data" 
                  value={newTag.tagGroup}
                  onChange={(e) => setNewTag({...newTag, tagGroup: e.target.value})}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-id">Tag ID</Label>
                <Input 
                  id="tag-id" 
                  type="number"
                  placeholder="e.g., 1, 2, 3" 
                  value={newTag.tagId || ''}
                  onChange={(e) => setNewTag({...newTag, tagId: parseInt(e.target.value) || 0})}
                  className="border-gray-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="content-desc">Description</Label>
                <Input 
                  id="content-desc" 
                  placeholder="e.g., Amount, Currency" 
                  value={newTag.contentDesc}
                  onChange={(e) => setNewTag({...newTag, contentDesc: e.target.value})}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="json-key">JSON Key</Label>
                <Input 
                  id="json-key" 
                  placeholder="e.g., amount, currency" 
                  value={newTag.jsonKey}
                  onChange={(e) => setNewTag({...newTag, jsonKey: e.target.value})}
                  className="border-gray-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="content-value">Value</Label>
                <Input 
                  id="content-value" 
                  placeholder="Static value (if applicable)" 
                  value={newTag.contentValue}
                  onChange={(e) => setNewTag({...newTag, contentValue: e.target.value})}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select 
                  value={newTag.format} 
                  onValueChange={(value) => setNewTag({...newTag, format: value})}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">String (S)</SelectItem>
                    <SelectItem value="N">Numeric (N)</SelectItem>
                    <SelectItem value="A">Alphanumeric (A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-length">Min Length</Label>
                <Input 
                  id="min-length" 
                  type="number"
                  value={newTag.minLength || 0}
                  onChange={(e) => setNewTag({...newTag, minLength: parseInt(e.target.value) || 0})}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-length">Max Length</Label>
                <Input 
                  id="max-length" 
                  type="number"
                  value={newTag.maxLength || 0}
                  onChange={(e) => setNewTag({...newTag, maxLength: parseInt(e.target.value) || 0})}
                  className="border-gray-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is-static" 
                  checked={newTag.isStatic === '1'}
                  onCheckedChange={(checked) => setNewTag({
                    ...newTag, 
                    isStatic: checked ? '1' : '0',
                    isDynamic: checked ? '0' : newTag.isDynamic
                  })}
                />
                <Label htmlFor="is-static">Static</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is-dynamic" 
                  checked={newTag.isDynamic === '1'}
                  onCheckedChange={(checked) => setNewTag({
                    ...newTag, 
                    isDynamic: checked ? '1' : '0',
                    isStatic: checked ? '0' : newTag.isStatic
                  })}
                />
                <Label htmlFor="is-dynamic">Dynamic</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="required" 
                  checked={newTag.required === '1'}
                  onCheckedChange={(checked) => setNewTag({...newTag, required: checked ? '1' : '0'})}
                />
                <Label htmlFor="required">Required</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="verify-json" 
                  checked={newTag.verifyJson === '1'}
                  onCheckedChange={(checked) => setNewTag({...newTag, verifyJson: checked ? '1' : '0'})}
                />
                <Label htmlFor="verify-json">Verify JSON</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="has-child" 
                  checked={newTag.hasChild === '1'}
                  onCheckedChange={(checked) => setNewTag({...newTag, hasChild: checked ? '1' : '0'})}
                />
                <Label htmlFor="has-child">Has Child</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usage">Usage</Label>
              <Textarea 
                id="usage" 
                placeholder="Describe how this tag should be used" 
                value={newTag.usage}
                onChange={(e) => setNewTag({...newTag, usage: e.target.value})}
                className="border-gray-300"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-primary" onClick={handleAddTag}>
              Add Tag
            </Button>
          </DialogFooter>
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
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtag-id">Subtag ID</Label>
                <Input 
                  id="subtag-id" 
                  type="number"
                  placeholder="e.g., 101, 102" 
                  value={newSubtag.subTagId || ''}
                  onChange={(e) => setNewSubtag({...newSubtag, subTagId: parseInt(e.target.value) || 0})}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtag-desc">Description</Label>
                <Input 
                  id="subtag-desc" 
                  placeholder="e.g., Version, Code" 
                  value={newSubtag.contentDesc}
                  onChange={(e) => setNewSubtag({...newSubtag, contentDesc: e.target.value})}
                  className="border-gray-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtag-json-key">JSON Key</Label>
                <Input 
                  id="subtag-json-key" 
                  placeholder="e.g., version, code" 
                  value={newSubtag.jsonKey}
                  onChange={(e) => setNewSubtag({...newSubtag, jsonKey: e.target.value})}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtag-value">Value</Label>
                <Input 
                  id="subtag-value" 
                  placeholder="Static value (if applicable)" 
                  value={newSubtag.contentValue}
                  onChange={(e) => setNewSubtag({...newSubtag, contentValue: e.target.value})}
                  className="border-gray-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtag-format">Format</Label>
                <Select 
                  value={newSubtag.format} 
                  onValueChange={(value) => setNewSubtag({...newSubtag, format: value})}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">String (S)</SelectItem>
                    <SelectItem value="N">Numeric (N)</SelectItem>
                    <SelectItem value="A">Alphanumeric (A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtag-min-length">Min Length</Label>
                <Input 
                  id="subtag-min-length" 
                  type="number"
                  value={newSubtag.minLength || 0}
                  onChange={(e) => setNewSubtag({...newSubtag, minLength: parseInt(e.target.value) || 0})}
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtag-max-length">Max Length</Label>
                <Input 
                  id="subtag-max-length" 
                  type="number"
                  value={newSubtag.maxLength || 0}
                  onChange={(e) => setNewSubtag({...newSubtag, maxLength: parseInt(e.target.value) || 0})}
                  className="border-gray-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="subtag-required" 
                  checked={newSubtag.required === '1'}
                  onCheckedChange={(checked) => setNewSubtag({...newSubtag, required: checked ? '1' : '0'})}
                />
                <Label htmlFor="subtag-required">Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="subtag-verify-json" 
                  checked={newSubtag.verifyJson === '1'}
                  onCheckedChange={(checked) => setNewSubtag({...newSubtag, verifyJson: checked ? '1' : '0'})}
                />
                <Label htmlFor="subtag-verify-json">Verify JSON</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="subtag-has-child" 
                  checked={newSubtag.hasChild === '1'}
                  onCheckedChange={(checked) => setNewSubtag({...newSubtag, hasChild: checked ? '1' : '0'})}
                />
                <Label htmlFor="subtag-has-child">Has Child</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subtag-usage">Usage</Label>
              <Textarea 
                id="subtag-usage" 
                placeholder="Describe how this subtag should be used" 
                value={newSubtag.usage}
                onChange={(e) => setNewSubtag({...newSubtag, usage: e.target.value})}
                className="border-gray-300"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewSubtagDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-primary" onClick={handleAddSubtag}>
              Add Subtag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* QR Preview Dialog */}
      <Dialog open={isQrPreviewOpen} onOpenChange={setIsQrPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-brand-primary flex items-center">
              <QrCode className="mr-2 h-5 w-5" />
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
          
          <DialogFooter>
            <Button onClick={() => setIsQrPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManager;
