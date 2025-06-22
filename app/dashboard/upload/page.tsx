import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoIcon, Upload, FileText } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upload & Train</h1>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Training Data
            </CardTitle>
            <CardDescription>
              Upload documents to train your AI models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <h3 className="font-medium text-lg">Drag and drop files</h3>
                <p className="text-sm text-muted-foreground">
                  Upload PDF, DOCX, TXT, or markdown files
                </p>
                <Button className="mt-4">
                  Select Files
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Status</CardTitle>
              <CardDescription>Status of your AI model training</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
                <InfoIcon size="16" strokeWidth={2} />
                No active training jobs
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Documents</CardTitle>
              <CardDescription>Documents you've uploaded for training</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 