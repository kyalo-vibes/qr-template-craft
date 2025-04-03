
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
  CreditCard 
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

const ApiTester: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Generate QR Form
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>("");
  const [jsonData, setJsonData] = useState<string>('{\n  "amount": "100.00",\n  "currency": "USD"\n}');
  
  // Verify QR Form
  const [qrString, setQrString] = useState<string>('');
  
  // Payment Callback Form
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  
  // Response states
  const [generateResponse, setGenerateResponse] = useState<GenerateQRCodeResponse | null>(null);
  const [verifyResponse, setVerifyResponse] = useState<VerifyQRCodeResponse | null>(null);
  const [callbackResponse, setCallbackResponse] = useState<PaymentCallbackResponse | null>(null);

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
        data: dataObj
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
        data: dataObj
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
        qrString: qrString
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
        paymentRef: paymentRef
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
        <h1 className="text-2xl font-bold mb-6">QR Code API Tester</h1>
        
        <Tabs defaultValue="generate">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="generate" className="text-sm md:text-base flex items-center">
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR
            </TabsTrigger>
            <TabsTrigger value="verify" className="text-sm md:text-base flex items-center">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify QR
            </TabsTrigger>
            <TabsTrigger value="callback" className="text-sm md:text-base flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Payment Callback
            </TabsTrigger>
          </TabsList>
          
          {/* Generate QR Section */}
          <TabsContent value="generate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate QR Code</CardTitle>
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
                          <SelectTrigger>
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
                          <SelectTrigger>
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data (JSON)</label>
                      <Textarea 
                        value={jsonData}
                        onChange={(e) => setJsonData(e.target.value)}
                        className="h-60 font-mono text-sm"
                        placeholder="Enter JSON data"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={handleGenerateStaticQR} className="bg-qr-primary hover:bg-blue-600">
                        Generate Static QR
                      </Button>
                      <Button onClick={handleGenerateDynamicQR} className="bg-qr-accent hover:bg-indigo-600">
                        Generate Dynamic QR
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Result</CardTitle>
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
                          <p className="font-mono">{generateResponse.referenceNumber}</p>
                        </div>
                      )}
                      
                      {generateResponse.qrString && (
                        <div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-500">QR String</p>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(generateResponse.qrString!)}
                            >
                              Copy
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
                          <img 
                            src={generateResponse.qrImage} 
                            alt="Generated QR Code" 
                            className="max-w-full h-auto mx-auto border p-2"
                            style={{ maxHeight: "200px" }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
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
              <Card>
                <CardHeader>
                  <CardTitle>Verify QR Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">QR String</label>
                      <Textarea 
                        value={qrString}
                        onChange={(e) => setQrString(e.target.value)}
                        className="h-60 font-mono text-sm"
                        placeholder="Enter QR string to verify"
                      />
                    </div>
                    
                    <Button onClick={handleVerifyQR} className="bg-qr-primary hover:bg-blue-600 w-full">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Verification Result</CardTitle>
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
                    <div className="text-center py-12 text-gray-500">
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
              <Card>
                <CardHeader>
                  <CardTitle>Payment Callback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                      <Input 
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Enter reference number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
                      <Input 
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="Enter payment reference"
                      />
                    </div>
                    
                    <Button onClick={handlePaymentCallback} className="bg-qr-primary hover:bg-blue-600 w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Process Payment Callback
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Callback Result</CardTitle>
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
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
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
