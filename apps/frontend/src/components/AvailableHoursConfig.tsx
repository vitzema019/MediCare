import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDoctorAvailableHours, updateDoctorAvailableHours, type DaySchedule } from "@/lib/api";

interface AvailableHoursConfigProps {
  doctorId: string;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const AvailableHoursConfig = ({ doctorId }: AvailableHoursConfigProps) => {
  const { toast } = useToast();
  const [availableHours, setAvailableHours] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailableHours();
  }, [doctorId]);

  const loadAvailableHours = async () => {
    setLoading(true);
    try {
      const data = await getDoctorAvailableHours(doctorId);
      if (data.availableHours && data.availableHours.length > 0) {
        // Clean the data - remove any extra properties from MongoDB
        const cleanHours = data.availableHours.map((schedule: any) => ({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          enabled: schedule.enabled,
        }));
        setAvailableHours(cleanHours);
      } else {
        // Initialize with default schedule (Monday-Friday, 9:00-17:00)
        const defaultSchedule: DaySchedule[] = [
          { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", enabled: false }, // Sunday
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: true }, // Monday
          { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: true }, // Tuesday
          { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: true }, // Wednesday
          { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: true }, // Thursday
          { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: true }, // Friday
          { dayOfWeek: 6, startTime: "09:00", endTime: "17:00", enabled: false }, // Saturday
        ];
        setAvailableHours(defaultSchedule);
      }
    } catch (error: any) {
      console.error("Failed to load available hours:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load available hours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Clean the data - remove any extra properties like _id, property_id, etc.
      const cleanAvailableHours = availableHours.map(schedule => ({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        enabled: schedule.enabled,
      }));
      
      await updateDoctorAvailableHours(doctorId, cleanAvailableHours);
      toast({
        title: "Success",
        description: "Available hours updated successfully",
      });
    } catch (error: any) {
      console.error("Failed to save available hours:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save available hours",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateDaySchedule = (dayOfWeek: number, field: keyof DaySchedule, value: string | boolean) => {
    setAvailableHours(prev => 
      prev.map(schedule => 
        schedule.dayOfWeek === dayOfWeek 
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
  };

  if (loading) {
    return (
      <Card className="p-6 glass-dashboard">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg text-muted-foreground">Loading available hours...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 glass-dashboard hover:shadow-[var(--shadow-medium)] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Available Hours</h2>
            <p className="text-sm text-muted-foreground">Configure your weekly schedule</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Schedule
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {availableHours.map((schedule) => (
          <div
            key={schedule.dayOfWeek}
            className="flex items-center gap-4 p-4 rounded-lg border border-border/70 bg-card/50"
          >
            <div className="flex items-center gap-3 flex-1">
              <Switch
                checked={schedule.enabled}
                onCheckedChange={(checked) => updateDaySchedule(schedule.dayOfWeek, "enabled", checked)}
              />
              <Label className="w-24 font-medium">
                {dayNames[schedule.dayOfWeek]}
              </Label>
            </div>
            
            {schedule.enabled && (
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`start-${schedule.dayOfWeek}`} className="text-sm text-muted-foreground">
                    From:
                  </Label>
                  <Input
                    id={`start-${schedule.dayOfWeek}`}
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => updateDaySchedule(schedule.dayOfWeek, "startTime", e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`end-${schedule.dayOfWeek}`} className="text-sm text-muted-foreground">
                    To:
                  </Label>
                  <Input
                    id={`end-${schedule.dayOfWeek}`}
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => updateDaySchedule(schedule.dayOfWeek, "endTime", e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            )}
            
            {!schedule.enabled && (
              <div className="flex-1 text-sm text-muted-foreground italic">
                Not available
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Time slots will be automatically generated based on your configured hours. 
          Patients will only see available slots that don't conflict with existing appointments.
        </p>
      </div>
    </Card>
  );
};

