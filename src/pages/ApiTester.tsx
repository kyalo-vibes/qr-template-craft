
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { 
  QrCode,
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  CreditCard,
  Copy,
  Check
} from "lucide-react";
import { 
  getAllTemplates, 
  journeyTypes 
} from "@/services/templateService";
import { 
  generateStaticQRCode, 
  generateDynamicQRCode, 
  verifyQRCode, 
  processPaymentCallback 
} from "@/services/apiService";
import { 
  Template, 
  GenerateQRCodeRequest,
  GenerateQRCodeResponse,
  VerifyQRCodeRequest,
  VerifyQRCodeResponse,
  PaymentCallbackRequest,
  PaymentCallbackResponse
} from "@/types/template";

// Channel IDs for dropdown
const channelOptions = [
  { id: "1", name: "Mobile App" },
  { id: "2", name: "Web Portal" },
  { id: "3", name: "Branch Kiosk" },
  { id: "4", name: "ATM" },
  { id: "5", name: "Agency" }
];

// Response format options
const responseFormatOptions = [
  { id: "image", name: "Image" },
  { id: "pdf", name: "PDF" }
];

const ApiTester: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Generate QR Form
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("1");
  const [selectedResponseFormat, setSelectedResponseFormat] = useState<string>("image");
  const [jsonData, setJsonData] = useState<string>('{\n  "amount": "100.00",\n  "currency": "USD"\n}');
  
  // Verify QR Form
  const [qrString, setQrString] = useState<string>('');
  const [requestMessageId, setRequestMessageId] = useState<string>(generateRandomId());
  const [requestDateTime, setRequestDateTime] = useState<string>(new Date().toISOString());
  const [verifyChannelId, setVerifyChannelId] = useState<string>("1");
  
  // Payment Callback Form
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [callbackRequestMessageId, setCallbackRequestMessageId] = useState<string>(generateRandomId());
  
  // Response states
  const [generateResponse, setGenerateResponse] = useState<GenerateQRCodeResponse | null>(null);
  const [verifyResponse, setVerifyResponse] = useState<VerifyQRCodeResponse | null>(null);
  const [callbackResponse, setCallbackResponse] = useState<PaymentCallbackResponse | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Helper function to generate random ID
  function generateRandomId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

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

  // Handle static QR code generation
  const handleGenerateStaticQR = async () => {
    try {
      // Parse JSON data
      let dataObj;
      try {
        dataObj = JSON.parse(jsonData);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please provide valid JSON data.",
          variant: "destructive"
        });
        return;
      }
      
      const request: GenerateQRCodeRequest = {
        templateId: parseInt(selectedTemplateId),
        journey: selectedJourneyId,
        data: dataObj,
        channelId: parseInt(selectedChannelId),
        responseFormat: selectedResponseFormat
      };
      
      const response = await generateStaticQRCode(request);
      setGenerateResponse(response);
      
      toast({
        title: "QR Code Generated",
        description: "Static QR code has been successfully generated."
      });
    } catch (error) {
      console.error("Error generating static QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please check your inputs and try again.",
        variant: "destructive"
      });
    }
  };

  // Handle dynamic QR code generation
  const handleGenerateDynamicQR = async () => {
    try {
      // Parse JSON data
      let dataObj;
      try {
        dataObj = JSON.parse(jsonData);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please provide valid JSON data.",
          variant: "destructive"
        });
        return;
      }
      
      const request: GenerateQRCodeRequest = {
        templateId: parseInt(selectedTemplateId),
        journey: selectedJourneyId,
        data: dataObj,
        channelId: parseInt(selectedChannelId),
        responseFormat: selectedResponseFormat
      };
      
      const response = await generateDynamicQRCode(request);
      setGenerateResponse(response);
      
      toast({
        title: "QR Code Generated",
        description: "Dynamic QR code has been successfully generated."
      });
    } catch (error) {
      console.error("Error generating dynamic QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please check your inputs and try again.",
        variant: "destructive"
      });
    }
  };

  // Handle QR code verification
  const handleVerifyQR = async () => {
    try {
      if (!qrString.trim()) {
        toast({
          title: "Missing QR String",
          description: "Please provide a QR string to verify.",
          variant: "destructive"
        });
        return;
      }
      
      const request: VerifyQRCodeRequest = {
        qrString: qrString,
        requestMessageId: requestMessageId,
        requestDateTime: requestDateTime,
        requestType: "VerifyQRCode",
        channelId: verifyChannelId
      };
      
      const response = await verifyQRCode(request);
      setVerifyResponse(response);
      
      toast({
        title: "QR Code Verified",
        description: `Verification result: ${response.isValid ? 'Valid' : 'Invalid'}`
      });
    } catch (error) {
      console.error("Error verifying QR code:", error);
      toast({
        title: "Error",
        description: "Failed to verify QR code. Please check your input and try again.",
        variant: "destructive"
      });
    }
  };

  // Handle payment callback
  const handlePaymentCallback = async () => {
    try {
      if (!referenceNumber.trim() || !paymentRef.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide both reference number and payment reference.",
          variant: "destructive"
        });
        return;
      }
      
      const request: PaymentCallbackRequest = {
        referenceNumber: referenceNumber,
        paymentRef: paymentRef,
        requestMessageId: callbackRequestMessageId
      };
      
      const response = await processPaymentCallback(request);
      setCallbackResponse(response);
      
      toast({
        title: "Callback Processed",
        description: `Response: ${response.responseMessage}`
      });
    } catch (error) {
      console.error("Error processing payment callback:", error);
      toast({
        title: "Error",
        description: "Failed to process payment callback. Please check your inputs and try again.",
        variant: "destructive"
      });
    }
  };

  // Copy QR string to clipboard
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6 text-brand-primary">QR Code API Tester</h1>
        
        <Tabs defaultValue="generate">
          <TabsList className="grid grid-cols-3 mb-6 bg-brand-primary/10">
            <TabsTrigger value="generate" className="text-sm md:text-base flex items-center data-[state=active]:bg-brand-primary data-[state=active]:text-white">
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR
            </TabsTrigger>
            <TabsTrigger value="verify" className="text-sm md:text-base flex items-center data-[state=active]:bg-brand-primary data-[state=active]:text-white">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify QR
            </TabsTrigger>
            <TabsTrigger value="callback" className="text-sm md:text-base flex items-center data-[state=active]:bg-brand-primary data-[state=active]:text-white">
              <CreditCard className="mr-2 h-4 w-4" />
              Payment Callback
            </TabsTrigger>
          </TabsList>
          
          {/* Generate QR Section */}
          <TabsContent value="generate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-t-4 border-t-brand-primary shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-brand-primary flex items-center">
                    <QrCode className="mr-2 h-5 w-5" />
                    Generate QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                        <Select 
                          value={selectedTemplateId}
                          onValueChange={(value) => {
                            setSelectedTemplateId(value);
                            // Also set the journey ID from the selected template
                            const template = templates.find(t => t.id.toString() === value);
                            if (template) {
                              setSelectedJourneyId(template.journeyId);
                            }
                          }}
                        >
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map(template => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Journey</label>
                        <Select value={selectedJourneyId} onValueChange={setSelectedJourneyId}>
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select journey" />
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                        <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                          <SelectContent>
                            {channelOptions.map(channel => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Response Format</label>
                        <Select value={selectedResponseFormat} onValueChange={setSelectedResponseFormat}>
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            {responseFormatOptions.map(format => (
                              <SelectItem key={format.id} value={format.id}>
                                {format.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data (JSON)</label>
                      <Textarea 
                        value={jsonData}
                        onChange={(e) => setJsonData(e.target.value)}
                        className="h-60 font-mono text-sm border-gray-300"
                        placeholder="Enter JSON data"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={handleGenerateStaticQR} className="btn-primary">
                        Generate Static QR
                      </Button>
                      <Button onClick={handleGenerateDynamicQR} className="btn-secondary">
                        Generate Dynamic QR
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-t-4 border-t-brand-secondary shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-brand-secondary">Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {generateResponse ? (
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
                        <div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-500">QR String</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(generateResponse.qrString!)}
                              className="text-brand-primary hover:text-brand-primary/80"
                            >
                              {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded border mt-1">
                            {generateResponse.qrString}
                          </p>
                        </div>
                      )}
                      
                      {generateResponse.qrImage && (
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-500 mb-2">QR Image</p>
                          <div className="border border-gray-200 rounded-lg p-4 bg-white inline-block">
                            <img 
                              src={generateResponse.qrImage} 
                              alt="Generated QR Code" 
                              className="max-w-full h-auto mx-auto"
                              style={{ maxHeight: "200px" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
                      <QrCode className="h-10 w-10 opacity-30 mx-auto mb-3" />
                      Generate a QR code to see the result here
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Verify QR Section */}
          <TabsContent value="verify">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-t-4 border-t-brand-primary shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-brand-primary flex items-center">
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Verify QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">QR String</label>
                      <Textarea 
                        value={qrString}
                        onChange={(e) => setQrString(e.target.value)}
                        className="h-40 font-mono text-sm border-gray-300"
                        placeholder="Enter QR string to verify"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Request Message ID</label>
                        <Input 
                          value={requestMessageId}
                          onChange={(e) => setRequestMessageId(e.target.value)}
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                        <Select value={verifyChannelId} onValueChange={setVerifyChannelId}>
                          <SelectTrigger className="border-gray-300">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                          <SelectContent>
                            {channelOptions.map(channel => (
                              <SelectItem key={channel.id} value={channel.id}>
                                {channel.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button onClick={handleVerifyQR} className="btn-primary w-full">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-t-4 border-t-brand-secondary shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-brand-secondary">Verification Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {verifyResponse ? (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <span 
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-2 ${
                            verifyResponse.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {verifyResponse.isValid ? '✓' : '✗'}
                        </span>
                        <span className="text-lg font-medium">
                          {verifyResponse.isValid ? 'Valid QR Code' : 'Invalid QR Code'}
                        </span>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Response Code</p>
                        <p className={`text-lg ${verifyResponse.responseCode === "200" ? "text-green-600" : "text-red-600"}`}>
                          {verifyResponse.responseCode}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Message</p>
                        <p>{verifyResponse.responseMessage}</p>
                      </div>
                      
                      {verifyResponse.data && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">QR Data</p>
                          <pre className="bg-gray-50 p-3 rounded border overflow-auto text-xs">
                            {JSON.stringify(verifyResponse.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
                      <ShieldCheck className="h-10 w-10 opacity-30 mx-auto mb-3" />
                      Verify a QR code to see the result here
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Payment Callback Section */}
          <TabsContent value="callback">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-t-4 border-t-brand-primary shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-brand-primary flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Payment Callback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Request Message ID</label>
                      <Input 
                        value={callbackRequestMessageId}
                        onChange={(e) => setCallbackRequestMessageId(e.target.value)}
                        className="border-gray-300"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                      <Input 
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="border-gray-300"
                        placeholder="Enter reference number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
                      <Input 
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        className="border-gray-300"
                        placeholder="Enter payment reference"
                      />
                    </div>
                    
                    <Button onClick={handlePaymentCallback} className="btn-primary w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Process Payment Callback
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-t-4 border-t-brand-secondary shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-brand-secondary">Callback Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {callbackResponse ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Response Code</p>
                        <p className={`text-lg ${callbackResponse.responseCode === "200" ? "text-green-600" : "text-red-600"}`}>
                          {callbackResponse.responseCode}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Message</p>
                        <p>{callbackResponse.responseMessage}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Response Date/Time</p>
                        <p>{callbackResponse.responseDateTime ? new Date(callbackResponse.responseDateTime).toLocaleString() : '-'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Request Message ID</p>
                        <p className="font-mono">{callbackResponse.requestMessageId || '-'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
                      <CreditCard className="h-10 w-10 opacity-30 mx-auto mb-3" />
                      Process a payment callback to see the result here
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApiTester;
