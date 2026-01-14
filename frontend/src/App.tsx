import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Scissors, Minimize, Lock, Unlock } from 'lucide-react';
import { MergeTab } from './components/MergeTab';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8" dir="ltr">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-900">
            PDF Master 🛠️
          </h1>
          <p className="text-lg text-slate-600">
            All your document editing tools in one place.
          </p>
        </div>

        <Tabs defaultValue="merge" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-slate-200">
            <TabsTrigger value="merge" className="gap-2 py-3">
              <FileText className="w-4 h-4" /> Merge
            </TabsTrigger>
            <TabsTrigger value="delete" className="gap-2 py-3">
              <FileText className="w-4 h-4" /> Delete Pages
            </TabsTrigger>
            <TabsTrigger value="split" className="gap-2 py-3">
              <Scissors className="w-4 h-4" /> Split
            </TabsTrigger>
            <TabsTrigger value="compress" className="gap-2 py-3">
              <Minimize className="w-4 h-4" /> Compress
            </TabsTrigger>
            <TabsTrigger value="lock" className="gap-2 py-3">
              <Lock className="w-4 h-4" /> Lock
            </TabsTrigger>
            <TabsTrigger value="unlock" className="gap-2 py-3">
              <Unlock className="w-4 h-4" /> Unlock
            </TabsTrigger>
          </TabsList>

          <TabsContent value="merge" className="mt-6">
            <MergeTab />
          </TabsContent>

          <TabsContent value="split" className="mt-6">
            <Card>
              <CardContent className="p-10 text-center text-slate-500">
                Coming soon...
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compress" className="mt-6">
            <Card>
              <CardContent className="p-10 text-center text-slate-500">
                Coming soon...
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lock" className="mt-6">
            <Card>
              <CardContent className="p-10 text-center text-slate-500">
                Coming soon...
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unlock" className="mt-6">
            <Card>
              <CardContent className="p-10 text-center text-slate-500">
                Coming soon...
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
