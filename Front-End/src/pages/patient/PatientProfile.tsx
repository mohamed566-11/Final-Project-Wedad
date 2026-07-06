import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Calendar, 
  Heart, 
  Activity, 
  FileText, 
  AlertCircle,
  Edit3,
  Save,
  X,
  LogOut,
  ArrowRight,
  Droplet,
  Scale,
  Ruler,
  UserPlus,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/utils/constants';
import ProfileHeader from '@/components/profile/ProfileHeader';
import BMICard from '@/components/profile/BMICard';
import EmergencyContactCard from '@/components/profile/EmergencyContactCard';
import ProfileStats from '@/components/profile/ProfileStats';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const NewPatientProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    profile,
    stats,
    lifeStages,
    loading,
    updating,
    updateBasicInfo,
    updateMedicalInfo,
    updateEmergencyContact,
    deleteProfileImage,
    refreshProfile
  } = useProfile();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<'basic' | 'medical' | 'emergency' | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  // Form states
  const [basicInfoForm, setBasicInfoForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    age: profile?.age || null,
    life_stage_id: profile?.life_stage_id || null,
  });

  const [medicalInfoForm, setMedicalInfoForm] = useState({
    height: profile?.profile?.height || null,
    weight: profile?.profile?.weight || null,
    blood_type: profile?.profile?.blood_type || '',
    date_of_birth: profile?.profile?.date_of_birth || '',
    national_id: profile?.profile?.national_id || '',
    medical_history: profile?.profile?.medical_history || '',
    chronic_diseases: profile?.profile?.chronic_diseases || [],
    allergies: profile?.profile?.allergies || [],
    current_medications: profile?.profile?.current_medications || [],
  });

  const [emergencyContactForm, setEmergencyContactForm] = useState({
    emergency_contact_name: profile?.profile?.emergency_contact_name || '',
    emergency_contact_phone: profile?.profile?.emergency_contact_phone || '',
  });

  // Update forms when profile loads
  React.useEffect(() => {
    if (profile) {
      setBasicInfoForm({
        name: profile.name || '',
        phone: profile.phone || '',
        age: profile.age || null,
        life_stage_id: profile.life_stage_id || null,
      });

      setMedicalInfoForm({
        height: profile.profile?.height || null,
        weight: profile.profile?.weight || null,
        blood_type: profile.profile?.blood_type || '',
        date_of_birth: profile.profile?.date_of_birth || '',
        national_id: profile.profile?.national_id || '',
        medical_history: profile.profile?.medical_history || '',
        chronic_diseases: profile.profile?.chronic_diseases || [],
        allergies: profile.profile?.allergies || [],
        current_medications: profile.profile?.current_medications || [],
      });

      setEmergencyContactForm({
        emergency_contact_name: profile.profile?.emergency_contact_name || '',
        emergency_contact_phone: profile.profile?.emergency_contact_phone || '',
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    const result = await updateBasicInfo(basicInfoForm);
    if (result.success) {
      setIsEditing(false);
      setEditingSection(null);
      setFormErrors({});
    } else if (result.error && typeof result.error === 'object') {
      // Handle validation errors
      setFormErrors(result.error as Record<string, string[]>);
    }
  };


  const handleMedicalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    const result = await updateMedicalInfo(medicalInfoForm);
    if (result.success) {
      setIsEditing(false);
      setEditingSection(null);
      setFormErrors({});
    } else if (result.error && typeof result.error === 'object') {
      // Handle validation errors
      setFormErrors(result.error as Record<string, string[]>);
    }
  };

  const handleEmergencyContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({}); // Clear previous errors
    const result = await updateEmergencyContact(emergencyContactForm);
    if (result.success) {
      setIsEditing(false);
      setEditingSection(null);
      setFormErrors({});
    } else if (result.error && typeof result.error === 'object') {
      // Handle validation errors
      setFormErrors(result.error as Record<string, string[]>);
    }
  };

  const handleImageChange = async (file: File) => {
    const result = await updateBasicInfo({ ...basicInfoForm, image: file });
    if (result.success) {
      toast.success('تم تحديث الصورة الشخصية بنجاح');
    }
  };

  const handleImageDelete = async () => {
    const result = await deleteProfileImage();
    if (result.success) {
      toast.success('تم حذف الصورة الشخصية بنجاح');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">لم يتم العثور على الملف الشخصي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(ROUTES.PATIENT_DASHBOARD)}
              className="gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              العودة للوحة التحكم
            </Button>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader 
          user={{
            name: profile.name,
            email: profile.email,
            image_url: profile.image_url,
            profile_completion: profile.profile_completion
          }}
          profileCompletion={profile.profile_completion}
          onImageChange={handleImageChange}
          editable={true}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
            <TabsTrigger value="medical">المعلومات الطبية</TabsTrigger>
            <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* BMI Card */}
              <div className="lg:col-span-1">
                <BMICard 
                  bmi={profile.profile?.bmi || null}
                  category={profile.profile?.bmi_category || null}
                  height={profile.profile?.height || null}
                  weight={profile.profile?.weight || null}
                />
              </div>

              {/* Emergency Contact */}
              <div className="lg:col-span-2">
                <EmergencyContactCard
                  name={profile.profile?.emergency_contact_name || null}
                  phone={profile.profile?.emergency_contact_phone || null}
                  onEdit={() => {
                    setActiveTab('medical');
                    setEditingSection('emergency');
                    setIsEditing(true);
                  }}
                  editable={true}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab('basic');
                      setEditingSection('basic');
                      setIsEditing(true);
                    }}
                    className="h-20 flex-col gap-2"
                  >
                    <User className="w-5 h-5" />
                    <span>تعديل المعلومات</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab('medical');
                      setEditingSection('medical');
                      setIsEditing(true);
                    }}
                    className="h-20 flex-col gap-2"
                  >
                    <Heart className="w-5 h-5" />
                    <span>المعلومات الطبية</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('stats')}
                    className="h-20 flex-col gap-2"
                  >
                    <Activity className="w-5 h-5" />
                    <span>الإحصائيات</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={refreshProfile}
                    disabled={updating}
                    className="h-20 flex-col gap-2"
                  >
                    <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
                    <span>تحديث البيانات</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    المعلومات الأساسية
                  </span>
                  {!isEditing && (
                    <Button 
                      onClick={() => {
                        setEditingSection('basic');
                        setIsEditing(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Edit3 className="w-4 h-4 ml-2" />
                      تعديل
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing && editingSection === 'basic' ? (
                  <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">الاسم الكامل</Label>
                        <Input
                          id="name"
                          value={basicInfoForm.name}
                          onChange={(e) => setBasicInfoForm({...basicInfoForm, name: e.target.value})}
                          placeholder="الاسم الكامل"
                        />
                        {formErrors.name && (
                          <p className="text-sm text-destructive mt-1">{formErrors.name[0]}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">رقم الهاتف</Label>
                        <Input
                          id="phone"
                          value={basicInfoForm.phone}
                          onChange={(e) => setBasicInfoForm({...basicInfoForm, phone: e.target.value})}
                          placeholder="01XXXXXXXXX"
                        />
                        {formErrors.phone && (
                          <p className="text-sm text-destructive mt-1">{formErrors.phone[0]}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="age">العمر</Label>
                        <Input
                          id="age"
                          type="number"
                          value={basicInfoForm.age || ''}
                          onChange={(e) => setBasicInfoForm({...basicInfoForm, age: parseInt(e.target.value) || null})}
                          placeholder="العمر"
                        />
                        {formErrors.age && (
                          <p className="text-sm text-destructive mt-1">{formErrors.age[0]}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="life_stage">المرحلة الحياتية</Label>
                        <Select 
                          value={basicInfoForm.life_stage_id?.toString() || ''} 
                          onValueChange={(value) => setBasicInfoForm({...basicInfoForm, life_stage_id: parseInt(value) || null})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المرحلة الحياتية" />
                          </SelectTrigger>
                          <SelectContent>
                            {lifeStages.map(stage => (
                              <SelectItem key={stage.id} value={stage.id.toString()}>
                                {stage.name} - {stage.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.life_stage_id && (
                          <p className="text-sm text-destructive mt-1">{formErrors.life_stage_id[0]}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={updating} className="gap-2">
                        <Save className="w-4 h-4" />
                        {updating ? 'جاري الحفظ...' : 'حفظ'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setEditingSection(null);
                        }}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        إلغاء
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">الاسم</Label>
                      <p className="font-medium">{profile.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">رقم الهاتف</Label>
                      <p className="font-medium">{profile.phone || 'غير محدد'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">العمر</Label>
                      <p className="font-medium">{profile.age ? `${profile.age} سنة` : 'غير محدد'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">المرحلة الحياتية</Label>
                      <p className="font-medium">{profile.life_stage?.name || 'غير محددة'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Info Tab */}
          <TabsContent value="medical">
            <div className="space-y-6">
              {/* Medical Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      المعلومات الطبية
                    </span>
                    {!isEditing && (
                      <Button 
                        onClick={() => {
                          setEditingSection('medical');
                          setIsEditing(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Edit3 className="w-4 h-4 ml-2" />
                        تعديل
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing && editingSection === 'medical' ? (
                    <form onSubmit={handleMedicalInfoSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="height">الطول (سم)</Label>
                          <Input
                            id="height"
                            type="number"
                            value={medicalInfoForm.height || ''}
                            onChange={(e) => setMedicalInfoForm({...medicalInfoForm, height: parseFloat(e.target.value) || null})}
                            placeholder="الطول بالسنتيمتر"
                          />
                          {formErrors.height && (
                            <p className="text-sm text-destructive mt-1">{formErrors.height[0]}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="weight">الوزن (كجم)</Label>
                          <Input
                            id="weight"
                            type="number"
                            value={medicalInfoForm.weight || ''}
                            onChange={(e) => setMedicalInfoForm({...medicalInfoForm, weight: parseFloat(e.target.value) || null})}
                            placeholder="الوزن بالكيلوغرام"
                          />
                          {formErrors.weight && (
                            <p className="text-sm text-destructive mt-1">{formErrors.weight[0]}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="blood_type">فصيلة الدم</Label>
                          <Select 
                            value={medicalInfoForm.blood_type} 
                            onValueChange={(value) => setMedicalInfoForm({...medicalInfoForm, blood_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الفصيلة" />
                            </SelectTrigger>
                            <SelectContent>
                              {bloodTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.blood_type && (
                            <p className="text-sm text-destructive mt-1">{formErrors.blood_type[0]}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={medicalInfoForm.date_of_birth}
                            onChange={(e) => setMedicalInfoForm({...medicalInfoForm, date_of_birth: e.target.value})}
                          />
                          {formErrors.date_of_birth && (
                            <p className="text-sm text-destructive mt-1">{formErrors.date_of_birth[0]}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="national_id">الرقم القومي</Label>
                          <Input
                            id="national_id"
                            value={medicalInfoForm.national_id}
                            onChange={(e) => setMedicalInfoForm({...medicalInfoForm, national_id: e.target.value})}
                            placeholder="14 رقمًا"
                            maxLength={14}
                          />
                          {formErrors.national_id && (
                            <p className="text-sm text-destructive mt-1">{formErrors.national_id[0]}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="medical_history">التاريخ المرضي</Label>
                        <Textarea
                          id="medical_history"
                          value={medicalInfoForm.medical_history}
                          onChange={(e) => setMedicalInfoForm({...medicalInfoForm, medical_history: e.target.value})}
                          placeholder="العمليات السابقة، الحالات الصحية الهامة..."
                          rows={3}
                        />
                        {formErrors.medical_history && (
                          <p className="text-sm text-destructive mt-1">{formErrors.medical_history[0]}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="chronic_diseases">الأمراض المزمنة</Label>
                          <Textarea
                            id="chronic_diseases"
                            value={medicalInfoForm.chronic_diseases.join(', ')}
                            onChange={(e) => setMedicalInfoForm({...medicalInfoForm, chronic_diseases: e.target.value.split(',').map(item => item.trim()).filter(item => item)})}
                            placeholder="مثال: السكري، الضغط..."
                            rows={2}
                          />
                          {formErrors.chronic_diseases && (
                            <p className="text-sm text-destructive mt-1">{formErrors.chronic_diseases[0]}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="allergies">الحساسية</Label>
                          <Textarea
                            id="allergies"
                            value={medicalInfoForm.allergies.join(', ')}
                            onChange={(e) => setMedicalInfoForm({...medicalInfoForm, allergies: e.target.value.split(',').map(item => item.trim()).filter(item => item)})}
                            placeholder="مثال: البنسلين، الفول السوداني..."
                            rows={2}
                          />
                          {formErrors.allergies && (
                            <p className="text-sm text-destructive mt-1">{formErrors.allergies[0]}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="current_medications">الأدوية الحالية</Label>
                          <Textarea
                            id="current_medications"
                            value={medicalInfoForm.current_medications.join(', ')}
                            onChange={(e) => setMedicalInfoForm({...medicalInfoForm, current_medications: e.target.value.split(',').map(item => item.trim()).filter(item => item)})}
                            placeholder="قائمة الأدوية التي تتناولها حالياً..."
                            rows={2}
                          />
                          {formErrors.current_medications && (
                            <p className="text-sm text-destructive mt-1">{formErrors.current_medications[0]}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={updating} className="gap-2">
                          <Save className="w-4 h-4" />
                          {updating ? 'جاري الحفظ...' : 'حفظ'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false);
                            setEditingSection(null);
                          }}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-muted-foreground">الطول</Label>
                          <p className="font-medium">{profile.profile?.height ? `${profile.profile.height} سم` : 'غير محدد'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">الوزن</Label>
                          <p className="font-medium">{profile.profile?.weight ? `${profile.profile.weight} كجم` : 'غير محدد'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">فصيلة الدم</Label>
                          <p className="font-medium">{profile.profile?.blood_type || 'غير محددة'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">تاريخ الميلاد</Label>
                          <p className="font-medium">{profile.profile?.date_of_birth ? new Date(profile.profile.date_of_birth).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">الرقم القومي</Label>
                          <p className="font-medium">{profile.profile?.national_id || 'غير محدد'}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-muted-foreground">التاريخ المرضي</Label>
                        <p className="font-medium">{profile.profile?.medical_history || 'لا يوجد'}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-muted-foreground">الأمراض المزمنة</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profile.profile?.chronic_diseases?.length > 0 ? 
                              profile.profile.chronic_diseases.map((disease, index) => (
                                <Badge key={index} variant="secondary">{disease}</Badge>
                              )) : 
                              <span className="text-muted-foreground">لا يوجد</span>
                            }
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">الحساسية</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profile.profile?.allergies?.length > 0 ? 
                              profile.profile.allergies.map((allergy, index) => (
                                <Badge key={index} variant="secondary">{allergy}</Badge>
                              )) : 
                              <span className="text-muted-foreground">لا يوجد</span>
                            }
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">الأدوية الحالية</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profile.profile?.current_medications?.length > 0 ? 
                              profile.profile.current_medications.map((medication, index) => (
                                <Badge key={index} variant="secondary">{medication}</Badge>
                              )) : 
                              <span className="text-muted-foreground">لا يوجد</span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Contact Card */}
              <EmergencyContactCard
                name={profile.profile?.emergency_contact_name || null}
                phone={profile.profile?.emergency_contact_phone || null}
                onEdit={() => {
                  setEditingSection('emergency');
                  setIsEditing(true);
                }}
                editable={true}
              />

              {isEditing && editingSection === 'emergency' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      معلومات الطوارئ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEmergencyContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emergency_name">اسم جهة الاتصال</Label>
                          <Input
                            id="emergency_name"
                            value={emergencyContactForm.emergency_contact_name}
                            onChange={(e) => setEmergencyContactForm({...emergencyContactForm, emergency_contact_name: e.target.value})}
                            placeholder="الاسم الكامل"
                            required
                          />
                          {formErrors.emergency_contact_name && (
                            <p className="text-sm text-destructive mt-1">{formErrors.emergency_contact_name[0]}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="emergency_phone">رقم الهاتف</Label>
                          <Input
                            id="emergency_phone"
                            value={emergencyContactForm.emergency_contact_phone}
                            onChange={(e) => setEmergencyContactForm({...emergencyContactForm, emergency_contact_phone: e.target.value})}
                            placeholder="01XXXXXXXXX"
                            required
                          />
                          {formErrors.emergency_contact_phone && (
                            <p className="text-sm text-destructive mt-1">{formErrors.emergency_contact_phone[0]}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={updating} className="gap-2">
                          <Save className="w-4 h-4" />
                          {updating ? 'جاري الحفظ...' : 'حفظ'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false);
                            setEditingSection(null);
                          }}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          إلغاء
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            {stats && (
              <ProfileStats
                profileCompletion={profile.profile_completion}
                missingFields={profile.missing_fields}
                bmi={stats.bmi}
                bmiCategory={stats.bmi_category}
                healthScore={stats.health_score}
                lastUpdated={stats.last_updated}
                onMissingFieldClick={(field) => {
                  // Map fields to appropriate tabs
                  if (['name', 'age', 'phone'].includes(field)) {
                    setActiveTab('basic');
                  } else if (['height', 'weight', 'blood_type', 'date_of_birth', 'emergency_contact_name', 'emergency_contact_phone'].includes(field)) {
                    setActiveTab('medical');
                  }
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NewPatientProfile;