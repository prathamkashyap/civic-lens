import React, { useRef, useState, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  AlertCircle,
  Check,
  Droplets,
  LampFloor,
  Loader,
  MapPin,
  Trash2,
  Upload,
  Waves,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { db } from '@/firebaseConfig';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/hooks/use-toast';
import { PriorityLevel, ReportCategory } from '@/types';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';

const CATEGORY_SEVERITY: Record<ReportCategory, number> = {
  'Water Supply': 1.0,
  Drainage: 0.8,
  Pothole: 0.6,
  Streetlight: 0.4,
  Waste: 0.2,
};

const CATEGORY_OPTIONS: Array<{
  value: ReportCategory;
  icon: React.ReactNode;
  label: string;
}> = [
  { value: 'Waste', icon: <Trash2 className="h-5 w-5" />, label: 'Waste' },
  { value: 'Pothole', icon: <AlertCircle className="h-5 w-5" />, label: 'Pothole' },
  { value: 'Streetlight', icon: <LampFloor className="h-5 w-5" />, label: 'Streetlight' },
  { value: 'Drainage', icon: <Waves className="h-5 w-5" />, label: 'Drainage' },
  { value: 'Water Supply', icon: <Droplets className="h-5 w-5" />, label: 'Water Supply' },
];

const calculateInitialPriority = (category: ReportCategory): PriorityLevel => {
  const score = 0.4 * CATEGORY_SEVERITY[category] + 0.3;

  if (score >= 0.7) return 'HIGH';
  if (score >= 0.4) return 'MEDIUM';
  return 'LOW';
};

export function ReportForm() {
  const [category, setCategory] = useState<ReportCategory>('Waste');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [address, setAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const compressed = await compressImage(file);

    const formData = new FormData();
    formData.append('file', compressed);
    formData.append('upload_preset', 'urban_unsigned');

    try {
      const res = await axios.post(
        'https://api.cloudinary.com/v1_1/djkrzogrq/image/upload',
        formData
      );
      setPhotoUrl(res.data.secure_url);
      toast({
        title: 'Image uploaded',
        description: 'Image successfully uploaded.',
      });
    } catch (err) {
      console.error('Image upload failed:', err);
      toast({
        title: 'Upload error',
        description: 'Failed to upload image.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data.display_name || 'Address not found';
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return 'Address not found';
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);

    if (!('geolocation' in navigator)) {
      setIsGettingLocation(false);
      toast({
        variant: 'destructive',
        title: 'Location unavailable',
        description: 'Geolocation is not supported by this browser.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setAddress(await reverseGeocode(latitude, longitude));
        setIsGettingLocation(false);
        toast({
          title: 'Location detected',
          description: 'Your location has been added.',
        });
      },
      () => {
        setIsGettingLocation(false);
        toast({
          variant: 'destructive',
          title: 'Location denied',
          description: 'Please allow location access or enter an address.',
        });
      }
    );
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (e.target.value.trim() !== '') {
      setLocation({ lat: 0, lng: 0 });
    }
  };

  // Rate limiting: prevent submissions more than once every 30 seconds
  const lastSubmitRef = useRef<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Client-side rate limit: 30 seconds between submissions
    const now = Date.now();
    if (now - lastSubmitRef.current < 30_000) {
      const waitSec = Math.ceil((30_000 - (now - lastSubmitRef.current)) / 1000);
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: `You can submit another report in ${waitSec} seconds.`,
      });
      setIsSubmitting(false);
      return;
    }

    if (!address || !photoUrl || !location.lat || !location.lng) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please upload a photo and use current location.',
      });
      setIsSubmitting(false);
      return;
    }

    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication error',
        description: 'You must be logged in.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const reportId = crypto.randomUUID();
      const now = new Date();

      await setDoc(doc(db, 'reports', reportId), {
        id: reportId,
        userId: currentUser.uid,
        userEmail: currentUser.email || 'unknown',
        category,
        description,
        photo: photoUrl,
        location: {
          lat: location.lat,
          lng: location.lng,
          address,
        },
        address,
        status: 'Pending',
        priority: calculateInitialPriority(category),
        timestamp: now,
        updatedAt: now,
      });

      lastSubmitRef.current = Date.now();
      toast({
        title: 'Report submitted',
        description: 'Your report has been successfully submitted.',
      });

      navigate('/reports');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: 'Could not submit your report.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mx-auto max-w-2xl border-border/70 bg-card/80 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Report an Issue</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Issue Category</Label>
            <RadioGroup
              value={category}
              onValueChange={(value) => setCategory(value as ReportCategory)}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {CATEGORY_OPTIONS.map((item) => (
                <div key={item.value}>
                  <RadioGroupItem value={item.value} id={item.value} className="peer hidden" />
                  <Label
                    htmlFor={item.value}
                    className={`flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border p-3 text-center transition ${
                      category === item.value
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-muted/30 text-foreground hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Photo</Label>
            <div
              onClick={() => photoInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  photoInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Upload a report photo"
              className="flex h-40 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
              {isUploading ? (
                <Loader className="h-6 w-6 animate-spin" />
              ) : photoUrl ? (
                <img src={photoUrl} alt="Reported civic issue" loading="lazy" className="h-full object-contain" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={handleAddressChange}
                placeholder="Use current location to attach coordinates"
              />
              <Button type="button" onClick={getCurrentLocation} disabled={isGettingLocation}>
                {isGettingLocation ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add useful details for municipal staff"
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Submit
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
