import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, Calendar, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import type { Review } from "@/types/map";
import { format } from "date-fns";

interface ReviewDisplayProps {
  amenityId: number;
}

interface ReviewResponse {
  reviews: Review[];
  averageRating: number | null;
  totalReviews: number;
}

export default function ReviewDisplay({ amenityId }: ReviewDisplayProps) {
  const { data, isLoading, error } = useQuery<ReviewResponse>({
    queryKey: [`/api/amenities/${amenityId}/reviews`],
    enabled: !!amenityId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-sm text-gray-500">Unable to load reviews</div>;
  }

  const { reviews, averageRating, totalReviews } = data;

  const FacilityIcon = ({ value }: { value: boolean | null }) => {
    if (value === true) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (value === false) return <XCircle className="w-4 h-4 text-red-600" />;
    return <HelpCircle className="w-4 h-4 text-gray-400" />;
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Average Rating Summary */}
      {totalReviews > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(averageRating || 0)} />
              <span className="font-medium">
                {averageRating?.toFixed(1)} / 5.0
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Individual Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          <p>No reviews yet</p>
          <p className="text-sm">Be the first to review this facility!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {reviews.map((review) => (
            <Card key={review.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-sm">{review.userNickname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.cleanlinessRating} />
                      {review.createdAt && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Facility Features */}
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <FacilityIcon value={review.hasToiletPaper} />
                      <span>Toilet Paper</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FacilityIcon value={review.hasMirror} />
                      <span>Mirror</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FacilityIcon value={review.hasHotWaterSoap} />
                      <span>Hot Water</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FacilityIcon value={review.hasSoap} />
                      <span>Soap</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FacilityIcon value={review.hasSanitaryDisposal} />
                      <span>Sanitary Disposal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        review.handDryerType === 'electric' ? 'bg-blue-500' :
                        review.handDryerType === 'paper' ? 'bg-yellow-500' :
                        review.handDryerType === 'none' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></span>
                      <span>Hand Dryer: {review.handDryerType || 'Not specified'}</span>
                    </div>
                  </div>

                  {/* Photo */}
                  {review.photoUrl && (
                    <div className="mt-2">
                      <img
                        src={review.photoUrl}
                        alt="User uploaded photo"
                        className="w-full h-24 object-cover rounded border"
                      />
                    </div>
                  )}

                  {/* Comments */}
                  {review.comments && (
                    <p className="text-sm text-gray-700 mt-2">
                      "{review.comments}"
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}