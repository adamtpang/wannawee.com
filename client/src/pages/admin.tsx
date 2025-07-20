import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, XCircle, MessageSquare, Users, BarChart3 } from "lucide-react";

interface PendingReview {
  id: number;
  amenityId: number;
  userNickname: string;
  cleanlinessRating: number;
  photoUrl?: string;
  comments?: string;
  createdAt: string;
  amenity?: {
    name: string;
    type: string;
  };
}

interface AdminStats {
  pendingReviews: number;
  flaggedReviews: number;
  totalReviews: number;
  totalUsers: number;
  pendingMessages: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [moderationNote, setModerationNote] = useState("");
  const [moderationAction, setModerationAction] = useState<"approved" | "rejected" | "flagged">("approved");

  // Check if user is admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch admin stats
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Access Denied",
          description: "Admin access required",
          variant: "destructive",
        });
      }
    },
  });

  // Fetch pending reviews
  const { data: pendingReviews, isLoading: loadingReviews } = useQuery({
    queryKey: ["/api/admin/reviews/pending"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Access Denied",
          description: "Admin access required",
          variant: "destructive",
        });
      }
    },
  });

  // Fetch flagged reviews
  const { data: flaggedReviews, isLoading: loadingFlagged } = useQuery({
    queryKey: ["/api/admin/reviews/flagged"],
    enabled: isAuthenticated,
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Access Denied",
          description: "Admin access required",
          variant: "destructive",
        });
      }
    },
  });

  // Moderate review mutation
  const moderateReview = useMutation({
    mutationFn: async (data: { reviewId: number; status: string; note?: string }) => {
      await apiRequest("/api/admin/reviews/moderate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Moderated",
        description: "Review status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/flagged"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedReview(null);
      setModerationNote("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to moderate review",
        variant: "destructive",
      });
    },
  });

  const handleModerateReview = () => {
    if (!selectedReview) return;
    
    moderateReview.mutate({
      reviewId: selectedReview.id,
      status: moderationAction,
      note: moderationNote || undefined,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage reviews, users, and content moderation</p>
        </div>
        <Button onClick={() => window.location.href = "/api/logout"} variant="outline">
          Logout
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingReviews || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Reviews</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.flaggedReviews || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingMessages || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Reviews</TabsTrigger>
          <TabsTrigger value="messages">Message Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>Review and approve user-submitted content</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReviews ? (
                <div>Loading reviews...</div>
              ) : (
                <div className="space-y-4">
                  {pendingReviews?.map((review: PendingReview) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {review.amenity?.type || 'Unknown'}
                            </Badge>
                            <span className="font-medium">
                              {review.amenity?.name || `Amenity ${review.amenityId}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Rating:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={star <= review.cleanlinessRating ? "text-yellow-400" : "text-gray-300"}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            By: {review.userNickname}
                          </p>
                          {review.comments && (
                            <p className="text-sm">{review.comments}</p>
                          )}
                          {review.photoUrl && (
                            <img 
                              src={review.photoUrl} 
                              alt="Review photo" 
                              className="w-32 h-32 object-cover rounded"
                            />
                          )}
                        </div>
                        <Button
                          onClick={() => setSelectedReview(review)}
                          size="sm"
                        >
                          Moderate
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingReviews?.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No pending reviews</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Reviews</CardTitle>
              <CardDescription>Reviews that have been flagged by users</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFlagged ? (
                <div>Loading flagged reviews...</div>
              ) : (
                <div className="space-y-4">
                  {flaggedReviews?.map((review: PendingReview) => (
                    <div key={review.id} className="border rounded-lg p-4 border-red-200">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Flagged</Badge>
                            <span className="font-medium">
                              {review.amenity?.name || `Amenity ${review.amenityId}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Rating:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={star <= review.cleanlinessRating ? "text-yellow-400" : "text-gray-300"}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            By: {review.userNickname}
                          </p>
                          {review.comments && (
                            <p className="text-sm">{review.comments}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => setSelectedReview(review)}
                          size="sm"
                          variant="destructive"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {flaggedReviews?.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No flagged reviews</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Queue</CardTitle>
              <CardDescription>Pending thank you messages to be sent</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Message queue management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Moderation Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Moderate Review</CardTitle>
              <CardDescription>
                Review submitted by {selectedReview.userNickname}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={moderationAction} onValueChange={(value: any) => setModerationAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                    <SelectItem value="flagged">Flag for Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Moderation Note (Optional)</Label>
                <Textarea
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  placeholder="Add a note about this moderation action..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedReview(null);
                    setModerationNote("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleModerateReview}
                  disabled={moderateReview.isPending}
                >
                  {moderateReview.isPending ? "Processing..." : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}