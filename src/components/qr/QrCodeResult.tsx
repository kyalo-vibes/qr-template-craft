
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, Download, EyeIcon, QrCode } from "lucide-react";
import { GenerateQRCodeResponse } from "@/types/template";
import { useToast } from "@/hooks/use-toast";
import QrTlvViewer from "./QrTlvViewer";

interface QrCodeResultProps {
  generateResponse: GenerateQRCodeResponse | null;
}

const QrCodeResult: React.FC<QrCodeResultProps> = ({ generateResponse }) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [showTlvView, setShowTlvView] = useState<boolean>(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({
        title: "Copied!",
        description: "QR string copied to clipboard."
      });
    });
  };

  const downloadQrCode = () => {
    if (!generateResponse?.qrImage) return;
    
    // For image format
    if (generateResponse.responseFormat === "image") {
      const link = document.createElement('a');
      link.href = generateResponse.qrImage;
      link.download = `qrcode-${generateResponse.referenceNumber || 'download'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Downloaded!",
        description: "QR code image downloaded successfully."
      });
    } 
    // For PDF format - typically would be a direct download from a URL
    else if (generateResponse.responseFormat === "pdf") {
      // In a real app, this might be a direct URL to the PDF
      // For this demo, we'll simulate it with a base64 data URL
      const link = document.createElement('a');
      link.href = generateResponse.qrImage; // In reality, this would be a PDF data URL or direct link
      link.download = `qrcode-${generateResponse.referenceNumber || 'download'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Downloaded!",
        description: "QR code PDF downloaded successfully."
      });
    }
  };

  if (!generateResponse) {
    return (
      <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
        <QrCode className="h-10 w-10 opacity-30 mx-auto mb-3" />
        Generate a QR code to see the result here
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-500">Response Code</p>
        <p className={`text-lg ${generateResponse.responseCode === "200" ? "text-green-600" : "text-red-600"}`}>
          {generateResponse.responseCode}
        </p>
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-500">Message</p>
        <p>{generateResponse.responseMessage}</p>
      </div>
      
      {generateResponse.referenceNumber && (
        <div>
          <p className="text-sm font-medium text-gray-500">Reference Number</p>
          <p className="font-mono bg-gray-50 p-2 rounded border">{generateResponse.referenceNumber}</p>
        </div>
      )}
      
      {generateResponse.qrString && (
        <>
          <div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-500">QR String</p>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTlvView(!showTlvView)}
                  className="text-brand-primary hover:text-brand-primary/80"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {showTlvView ? 'Hide TLV' : 'Show TLV'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(generateResponse.qrString!)}
                  className="text-brand-primary hover:text-brand-primary/80"
                >
                  {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded border mt-1">
              {generateResponse.qrString}
            </p>
          </div>
          
          {showTlvView && (
            <QrTlvViewer qrString={generateResponse.qrString} className="mt-4" />
          )}
        </>
      )}
      
      {generateResponse.qrImage && (
        <div className="text-center">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-gray-500">
              QR {generateResponse.responseFormat === "pdf" ? "PDF" : "Image"}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={downloadQrCode}
              className="text-brand-primary hover:text-brand-primary/80"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-white inline-block">
            {generateResponse.responseFormat === "pdf" ? (
              <div className="flex flex-col items-center">
                <QrCode className="h-16 w-16 text-brand-primary mb-2" />
                <p className="text-sm text-gray-500">PDF QR Code</p>
                <p className="text-xs text-gray-400">Click download to save</p>
              </div>
            ) : (
              <img 
                src={generateResponse.qrImage} 
                alt="Generated QR Code" 
                className="max-w-full h-auto mx-auto"
                style={{ maxHeight: "200px" }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QrCodeResult;
