import { Wand2, Upload, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Wand2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-center">
          CrowdHub
        </h1>
        <p className="text-xl text-center max-w-xl text-muted-foreground">
          Create, train, and deploy AI content with your own data
        </p>
      </div>
      
      <div className="flex flex-col gap-8 w-full max-w-lg">
        <Link href="/dashboard" className="w-full">
          <Button size="lg" className="w-full">
            Get Started
          </Button>
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border">
            <Wand2 className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">Generate</h3>
            <p className="text-xs text-center text-muted-foreground">Create AI content instantly</p>
          </div>
          
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border">
            <Upload className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">Train</h3>
            <p className="text-xs text-center text-muted-foreground">Upload your own data</p>
          </div>
          
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border">
            <Database className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">Deploy</h3>
            <p className="text-xs text-center text-muted-foreground">Use AI in your apps</p>
          </div>
        </div>
      </div>
      
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
