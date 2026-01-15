import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Scissors, Minimize, Lock, Unlock } from 'lucide-react';
import { MergeTab } from './components/MergeTab';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import ServerStatus from './components/ServerStatus';
import { API_URL } from './config';

function App() {
  const [status, setStatus] = useState<string>('Checking server connection...');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(20);

  const checkConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/`);
      setStatus(`Connected! Server says: ${response.data.message}`);
      setIsConnected(true);
    } catch (error) {
      setStatus('Error: No connection to server');
      console.error(error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (isConnected === true) return;
    let countdown: ReturnType<typeof setTimeout>;
    let poll: ReturnType<typeof setTimeout>;
    setSecondsLeft(20);
    checkConnection();
    countdown = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 20;
        return prev - 1;
      });
    }, 1000);
    poll = setInterval(() => {
      checkConnection();
      setSecondsLeft(20);
    }, 20000);
    return () => {
      clearInterval(countdown);
      clearInterval(poll);
    };
  }, [isConnected]);

  if (isConnected !== true) {
    return (
      <div className="min-h-screen bg-slate-50 p-8" dir="ltr">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
          <div className="mb-4 text-center text-slate-600 font-medium">
            Refreshing in {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}...
          </div>
          <ServerStatus
            isConnected={isConnected}
            status={status}
            onCheck={checkConnection}
          />
        </div>
      </div>
    );
  }

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
