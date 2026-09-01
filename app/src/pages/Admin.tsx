
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

const Admin = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor civic issues
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto py-12">
          <Alert variant="destructive" className="bg-destructive/10 mb-6">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle>Administrator access is not configured</AlertTitle>
            <AlertDescription>
              Administrative tools remain disabled until a server-verified administrator role is configured.
            </AlertDescription>
          </Alert>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
