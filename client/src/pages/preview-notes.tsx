import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { StickyNote } from "lucide-react";

// Demo notes data
const demoNotes = [
  {
    id: 1,
    title: "EUR/USD Analysis - Week 3",
    content: "Strong bullish momentum on EURUSD this week. Key resistance at 1.1000 level. Watch for breakout confirmation with volume. Fed meeting next week could provide catalyst for upside move. Technical indicators showing overbought conditions on H4, potential pullback to 1.0950 support before continuation.",
    date: "2024-01-15",
    tags: ["analysis", "EURUSD", "weekly"],
    category: "Market Analysis"
  },
  {
    id: 2,
    title: "Trading Psychology Notes",
    content: "Need to work on patience. Jumped into trade too early today on GBPUSD. Should wait for full confirmation before entering. Meditation before trading session helps with focus and emotional control. Plan to implement 5-minute breathing exercise before market open.",
    date: "2024-01-14",
    tags: ["psychology", "patience", "discipline"],
    category: "Personal Development"
  },
  {
    id: 3,
    title: "Risk Management Review",
    content: "Reviewed last month's trades. Risk per trade averaged 1.8% which is good. However, had one trade where I risked 3.5% - need to stick to 2% max rule strictly. Setting up automated position size calculator to prevent this error. Overall discipline improving month over month.",
    date: "2024-01-13",
    tags: ["risk", "review", "discipline"],
    category: "Risk Management"
  },
  {
    id: 4,
    title: "NFP Trade Setup - Friday",
    content: "NFP release this Friday at 8:30 AM EST. Expecting high volatility. Strategy: Stay out 15 minutes before/after release. If USD strengthens, look for pullback entry on EURUSD short. Target 1.0900, stop above 1.1020. Risk 1.5% max due to volatility.",
    date: "2024-01-12",
    tags: ["NFP", "news trading", "EURUSD", "strategy"],
    category: "Trade Ideas"
  },
  {
    id: 5,
    title: "Breakout Strategy Refinement",
    content: "Modified my breakout strategy after backtesting 100 trades. Key improvement: wait for 2 consecutive closes above resistance instead of just one. This reduced false breakouts by 40%. Also adding volume filter - only take trade if volume 1.5x average. Win rate improved from 58% to 71%.",
    date: "2024-01-11",
    tags: ["strategy", "backtesting", "breakout"],
    category: "Strategy Development"
  },
  {
    id: 6,
    title: "Weekly Goals & Targets",
    content: "This week's focus: maintain 2% risk per trade, target 3 high-probability setups only (quality over quantity). Stop trading after 2 consecutive losses to preserve capital. Morning routine: review economic calendar, check higher timeframe trends, identify key support/resistance levels.",
    date: "2024-01-10",
    tags: ["goals", "planning", "routine"],
    category: "Planning"
  }
];

export default function PreviewNotes() {
  const [newNote, setNewNote] = useState({ title: "", content: "", category: "" });
  const [showNewNote, setShowNewNote] = useState(false);

  return (
    <div className="p-4 lg:p-8 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" data-testid="text-notes-title">
            <StickyNote className="h-8 w-8 text-cyan-400" />
            Trading Notes
          </h1>
          <p className="text-gray-300 mb-3">Document your trading thoughts and analysis</p>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2 inline-block">
            <p className="text-sm text-cyan-400">📊 Preview Mode - Demo Data</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowNewNote(!showNewNote)}
          className="bg-cyan-600 hover:bg-cyan-700"
          data-testid="button-new-note"
        >
          {showNewNote ? "Cancel" : "New Note"}
        </Button>
      </div>

      {showNewNote && (
        <Card className="mb-6 bg-[#0f1f3a] border-[#1a2f4a]" data-testid="new-note-form">
          <CardHeader>
            <CardTitle className="text-white">Create New Note</CardTitle>
            <CardDescription>Add a new trading note or analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Note title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                data-testid="input-note-title"
              />
              <Input
                placeholder="Category"
                value={newNote.category}
                onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                data-testid="input-note-category"
              />
            </div>
            <Textarea
              placeholder="Write your note here..."
              className="min-h-32"
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              data-testid="textarea-note-content"
            />
            <div className="flex gap-2">
              <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="button-save-note">
                Save Note
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNewNote(false)}
                className="border-cyan-500/50 hover:bg-cyan-600/20"
                data-testid="button-cancel-note"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {demoNotes.map((note, index) => (
          <div key={note.id} className="relative">
            <Card 
              className="relative bg-slate-950 border border-cyan-500/20" 
              style={{
                boxShadow: '0 0 15px rgba(34, 211, 238, 0.15), 0 0 30px rgba(34, 211, 238, 0.08)'
              }}
              data-testid={`note-card-${index}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">{note.title}</CardTitle>
                    <CardDescription>
                      {note.category} • {new Date(note.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-cyan-500/50 hover:bg-cyan-600/20"
                      data-testid={`button-edit-note-${index}`}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-500/50 hover:bg-red-600/20 text-red-400"
                      data-testid={`button-delete-note-${index}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {note.content}
                </p>
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {demoNotes.length === 0 && (
        <Card className="bg-[#0f1f3a] border-[#1a2f4a]">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <StickyNote className="h-12 w-12 mx-auto mb-3 text-cyan-400/50" />
              <p>No notes yet</p>
              <p className="text-sm mt-1">Start documenting your trading journey</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
