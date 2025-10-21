import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Mail, User, Loader2, Check, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InviteTraderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserSearchResult {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  already_connected: boolean;
  pending_invite: boolean;
}

export function InviteTraderModal({ open, onOpenChange }: InviteTraderModalProps) {
  const [inviteMethod, setInviteMethod] = useState<"email" | "username">("email");
  const [emailInput, setEmailInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Search users by username
  const { data: searchResults = [], isLoading: isSearching, isError: searchError } = useQuery<UserSearchResult[]>({
    queryKey: ['/api/mentor/search-users', searchQuery],
    queryFn: async () => {
      const token = await getAuthToken();
      const res = await fetch(`/api/mentor/search-users?searchQuery=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to search users');
      }
      return res.json();
    },
    enabled: inviteMethod === 'username' && searchQuery.length >= 2,
  });

  // Send invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: async (data: { email?: string; username?: string; userId?: string }) => {
      return await apiRequest('POST', '/api/mentor/invite', data);
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent!",
        description: "The trader will receive a notification about your mentorship request.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mentor/traders'] });
      setEmailInput("");
      setUsernameInput("");
      setSearchQuery("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invitation",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleEmailInvite = () => {
    if (!emailInput || !emailInput.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    sendInviteMutation.mutate({ email: emailInput });
  };

  const handleUsernameInvite = (username: string, userId?: string) => {
    sendInviteMutation.mutate({ username, userId });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-invite-trader">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-cyan-600" />
            Invite Traders
          </DialogTitle>
          <DialogDescription>
            Send a mentorship invitation to a trader via email or username.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={inviteMethod} onValueChange={(v) => setInviteMethod(v as "email" | "username")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" data-testid="tab-invite-email">
              <Mail className="h-4 w-4 mr-2" />
              By Email
            </TabsTrigger>
            <TabsTrigger value="username" data-testid="tab-invite-username">
              <User className="h-4 w-4 mr-2" />
              By Username
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Trader's Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="trader@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                data-testid="input-email-invite"
              />
              <p className="text-xs text-muted-foreground">
                The trader will receive a notification if they have an account.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="username" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Search by Username</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Enter username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-username-search"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Search for traders by their username.
              </p>
            </div>

            {/* Search Results */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
                </div>
              )}

              {searchError && (
                <div className="text-center py-8 text-red-600 text-sm">
                  Failed to search users. Please try again.
                </div>
              )}

              {!isSearching && !searchError && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No users found matching "{searchQuery}"
                </div>
              )}

              {!isSearching && searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  data-testid={`user-result-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-cyan-600 text-white text-xs">
                        {getInitials(user.full_name || user.username || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {user.full_name || user.username || 'Anonymous User'}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.username && (
                        <p className="text-xs text-cyan-600">@{user.username}</p>
                      )}
                    </div>
                  </div>

                  {user.already_connected ? (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : user.pending_invite ? (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Pending
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleUsernameInvite(user.username || user.email, user.id)}
                      disabled={sendInviteMutation.isPending}
                      data-testid={`button-invite-user-${user.id}`}
                    >
                      Invite
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {inviteMethod === 'email' && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-invite"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmailInvite}
              disabled={sendInviteMutation.isPending || !emailInput}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="button-send-email-invite"
            >
              {sendInviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
