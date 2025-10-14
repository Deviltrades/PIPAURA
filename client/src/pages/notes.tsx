import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AccountSelector } from "@/components/AccountSelector";
import { useSelectedAccount } from "@/hooks/use-selected-account";
import { useState } from "react";

const mockNotes = [
  {
    id: 1,
    title: "EUR/USD Analysis - Week 3",
    content: "Strong bullish momentum on EURUSD this week. Key resistance at 1.1000 level. Watch for breakout confirmation with volume. Fed meeting next week could provide catalyst...",
    date: "2024-01-15",
    tags: ["analysis", "EURUSD", "weekly"],
    category: "Market Analysis"
  },
  {
    id: 2,
    title: "Trading Psychology Notes",
    content: "Need to work on patience. Jumped into trade too early today on GBPUSD. Should wait for full confirmation. Meditation before trading session helps with focus...",
    date: "2024-01-14",
    tags: ["psychology", "patience", "discipline"],
    category: "Personal Development"
  },
  {
    id: 3,
    title: "Risk Management Review",
    content: "Reviewed last month's trades. Risk per trade averaged 1.8% which is good. However, had one trade where I risked 3.5% - need to stick to 2% max rule...",
    date: "2024-01-13",
    tags: ["risk", "review", "discipline"],
    category: "Risk Management"
  }
];

export default function Notes() {
  const [selectedAccount, setSelectedAccount] = useSelectedAccount();
  const [newNote, setNewNote] = useState({ title: "", content: "", category: "" });
  const [showNewNote, setShowNewNote] = useState(false);

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Notes</h1>
          <p className="text-gray-300 mb-3">Document your trading thoughts and analysis</p>
          <AccountSelector value={selectedAccount} onValueChange={setSelectedAccount} />
        </div>
        <Button onClick={() => setShowNewNote(!showNewNote)}>
          {showNewNote ? "Cancel" : "New Note"}
        </Button>
      </div>

      {showNewNote && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Note</CardTitle>
            <CardDescription>Add a new trading note or analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Note title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
              <Input
                placeholder="Category"
                value={newNote.category}
                onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Write your note here..."
              className="min-h-32"
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            />
            <div className="flex gap-2">
              <Button>Save Note</Button>
              <Button variant="outline" onClick={() => setShowNewNote(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {mockNotes.map((note) => (
          <Card key={note.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  <CardDescription>
                    {note.category} • {new Date(note.date).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Delete</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {note.content}
              </p>
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockNotes.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>No notes yet</p>
              <p className="text-sm mt-1">Start documenting your trading journey</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}