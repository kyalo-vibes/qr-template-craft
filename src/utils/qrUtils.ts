
import { Template, TemplateTag, SubTemplateTag } from "@/types/template";

// Sample QR code generator based on template structure
export const generateSampleQRString = (template: Template): string => {
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
export const processSubtags = (subtags: SubTemplateTag[]): any => {
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
