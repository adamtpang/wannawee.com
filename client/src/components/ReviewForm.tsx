import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, Camera, CheckCircle, XCircle, X } from "lucide-react";
import type { ReviewFormData, MapAmenity } from "@/types/map";

interface ReviewFormProps {
  amenity: MapAmenity;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewForm({ amenity, onClose, onSuccess }: ReviewFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ReviewFormData>({
    amenityId: amenity.id ? parseInt(amenity.id) : 0,
    userNickname: "Anonymous",
    cleanlinessRating: 5,
    hasToiletPaper: null,
    hasMirror: null,
    hasHotWaterSoap: null,
    hasSoap: null,
    hasSanitaryDisposal: null,
    handDryerType: null,
    comments: "",
    photo: null,
    contactInfo: "",
    contactType: null,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const submitReview = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const formDataToSend = new FormData();
      formDataToSend.append("amenityId", data.amenityId.toString());
      formDataToSend.append("userNickname", data.userNickname);
      formDataToSend.append("cleanlinessRating", data.cleanlinessRating.toString());
      
      if (data.hasToiletPaper !== null) {
        formDataToSend.append("hasToiletPaper", data.hasToiletPaper.toString());
      }
      if (data.hasMirror !== null) {
        formDataToSend.append("hasMirror", data.hasMirror.toString());
      }
      if (data.hasHotWaterSoap !== null) {
        formDataToSend.append("hasHotWaterSoap", data.hasHotWaterSoap.toString());
      }
      if (data.hasSoap !== null) {
        formDataToSend.append("hasSoap", data.hasSoap.toString());
      }
      if (data.hasSanitaryDisposal !== null) {
        formDataToSend.append("hasSanitaryDisposal", data.hasSanitaryDisposal.toString());
      }
      if (data.handDryerType) {
        formDataToSend.append("handDryerType", data.handDryerType);
      }
      if (data.comments) {
        formDataToSend.append("comments", data.comments);
      }
      if (data.photo) {
        formDataToSend.append("photo", data.photo);
      }
      if (data.contactInfo) {
        formDataToSend.append("contactInfo", data.contactInfo);
      }
      if (data.contactType) {
        formDataToSend.append("contactType", data.contactType);
      }

      const response = await fetch("/api/reviews", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit review");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: "Thank you for helping other dog owners find clean facilities.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userNickname.trim()) {
      toast({
        title: "Please enter your nickname",
        variant: "destructive",
      });
      return;
    }
    submitReview.mutate(formData);
  };

  const FacilityCheckbox = ({ 
    label, 
    value, 
    onChange,
    isToiletPaper = false
  }: { 
    label: string; 
    value: boolean | null; 
    onChange: (value: boolean | null) => void;
    isToiletPaper?: boolean;
  }) => (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={value === true ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(true)}
          className="flex-1 h-8"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Yes
        </Button>
        <Button
          type="button"
          variant={value === false ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(false)}
          className="flex-1 h-8"
        >
          <XCircle className="w-3 h-3 mr-1" />
          {isToiletPaper ? "OUT" : "No"}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Review {amenity.name}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Photo Upload - moved to top */}
          <div className="space-y-2">
            <Label htmlFor="photo">Add Photo (Optional)</Label>
            <div className="flex items-center gap-2">
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("photo")?.click()}
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                {formData.photo ? "Change Photo" : "Add Photo"}
              </Button>
            </div>
            {formData.photo && (
              <span className="text-xs text-gray-600">{formData.photo.name}</span>
            )}
            {photoPreview && (
              <div className="mt-2">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-24 object-cover rounded border"
                />
              </div>
            )}
          </div>

          {/* Cleanliness Rating */}
          <div className="space-y-2">
            <Label>Cleanliness Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, cleanlinessRating: rating }))}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${
                      rating <= formData.cleanlinessRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {formData.cleanlinessRating === 1 && "Very Poor"}
              {formData.cleanlinessRating === 2 && "Poor"}
              {formData.cleanlinessRating === 3 && "Average"}
              {formData.cleanlinessRating === 4 && "Good"}
              {formData.cleanlinessRating === 5 && "Excellent"}
            </p>
          </div>

          {/* Early Submit Option */}
          <div className="border-t pt-3">
            <Button 
              type="submit" 
              disabled={submitReview.isPending}
              className="w-full"
              variant="outline"
            >
              {submitReview.isPending ? "Submitting..." : "I'm done. Submit"}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-1">
              Or continue below to add more details
            </p>
          </div>

          {/* Review Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-4">
              <FacilityCheckbox
                label="Toilet Paper"
                value={formData.hasToiletPaper}
                onChange={(value) => setFormData(prev => ({ ...prev, hasToiletPaper: value }))}
                isToiletPaper={true}
              />

              <FacilityCheckbox
                label="Mirrors"
                value={formData.hasMirror}
                onChange={(value) => setFormData(prev => ({ ...prev, hasMirror: value }))}
              />

              <FacilityCheckbox
                label="Hot Water"
                value={formData.hasHotWaterSoap}
                onChange={(value) => setFormData(prev => ({ ...prev, hasHotWaterSoap: value }))}
              />

              <FacilityCheckbox
                label="Soap"
                value={formData.hasSoap}
                onChange={(value) => setFormData(prev => ({ ...prev, hasSoap: value }))}
              />

              <FacilityCheckbox
                label="Sanitary Disposal"
                value={formData.hasSanitaryDisposal}
                onChange={(value) => setFormData(prev => ({ ...prev, hasSanitaryDisposal: value }))}
              />
            </div>
            
            {/* Hand Dryer Section */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Hand Dryer</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.handDryerType === 'electric' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, handDryerType: 'electric' }))}
                  className="flex-1 h-8"
                >
                  Electric
                </Button>
                <Button
                  type="button"
                  variant={formData.handDryerType === 'paper' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, handDryerType: 'paper' }))}
                  className="flex-1 h-8"
                >
                  Paper
                </Button>
                <Button
                  type="button"
                  variant={formData.handDryerType === 'none' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, handDryerType: 'none' }))}
                  className="flex-1 h-8"
                >
                  None
                </Button>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Additional Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Any additional details..."
              rows={2}
            />
          </div>

          {/* Thank You Message Contact */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs text-gray-600">You're awesome - thanks. We'd like to send you updates on your contribution.</p>
            
            <div className="space-y-2">
              <Label htmlFor="contactType">Preferred messaging app:</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'telegram', label: 'Telegram' },
                  { value: 'sms', label: 'SMS' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={formData.contactType === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      contactType: option.value as 'whatsapp' | 'telegram' | 'sms'
                    }))}
                    className="h-8"
                  >
                    {option.label}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={formData.contactType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    contactType: null,
                    contactInfo: ""
                  }))}
                  className="h-8"
                >
                  No Thanks
                </Button>
              </div>
            </div>

            {formData.contactType && formData.contactType !== 'sms' && (
              <div className="space-y-1">
                <Label htmlFor="contactInfo">
                  {formData.contactType === 'whatsapp' ? 'Phone Number' : 
                   formData.contactType === 'telegram' ? 'Telegram Username (@username)' : 
                   'Contact Info'}
                </Label>
                <Input
                  id="contactInfo"
                  value={formData.contactInfo || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder={
                    formData.contactType === 'whatsapp' ? '+1234567890' :
                    formData.contactType === 'telegram' ? '@yourusername' :
                    'Your contact info'
                  }
                />
              </div>
            )}

            {formData.contactType === 'sms' && (
              <div className="space-y-1">
                <Label htmlFor="contactInfo">Phone Number</Label>
                <Input
                  id="contactInfo"
                  value={formData.contactInfo || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder="+1234567890"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitReview.isPending}
              className="flex-1"
            >
              {submitReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}