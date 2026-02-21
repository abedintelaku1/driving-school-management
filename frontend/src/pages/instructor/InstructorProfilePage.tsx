import React, { useState, useEffect } from 'react';
import { UserIcon, LockIcon, SaveIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { api } from '../../utils/api';
import { toast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
};

type PasswordData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ValidationErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export function InstructorProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [profileErrors, setProfileErrors] = useState<ValidationErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<ValidationErrors>({});

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const result = await api.getInstructorProfile();
      if (result.ok && result.data) {
        setProfileData({
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          email: result.data.email || '',
          phone: result.data.phone || '',
          address: result.data.address || '',
        });
      } else {
        toast('error', result.data?.message || t('common.failedToLoadProfile'));
      }
    } catch (error) {
      toast('error', t('common.failedToLoadProfile'));
    } finally {
      setLoading(false);
    }
  };

  // Validate profile form
  const validateProfile = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!profileData.firstName.trim()) {
      errors.firstName = t('common.firstNameRequired');
    }
    
    if (!profileData.lastName.trim()) {
      errors.lastName = t('common.lastNameRequired');
    }
    
    if (!profileData.email.trim()) {
      errors.email = t('common.emailRequired');
    } else {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(profileData.email)) {
        errors.email = t('common.emailInvalid');
      }
    }
    
    if (!profileData.phone.trim()) {
      errors.phone = t('common.phoneRequired');
    }
    
    if (!profileData.address.trim()) {
      errors.address = t('common.addressRequired');
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password form
  const validatePassword = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = t('common.currentPasswordRequired');
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = t('common.newPasswordRequired');
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = t('common.newPasswordMinLength');
    } else {
      // Check password strength
      const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
      const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
      const hasNumber = /[0-9]/.test(passwordData.newPassword);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        errors.newPassword = t('common.newPasswordStrength');
      }
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = t('common.confirmPasswordRequired');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('common.passwordsDoNotMatch');
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfile()) {
      return;
    }
    
    try {
      setSavingProfile(true);
      const result = await api.updateInstructorProfile(profileData);
      
      if (result.ok && result.data) {
        toast('success', t('common.profileUpdated'));
        // Optionally refresh user data
        const { ok, data } = await api.me();
        if (ok && data?.user) {
          // The auth context will update on next check
        }
      } else {
        const errorMessage = result.data?.message || t('common.failedToUpdateProfile');
        toast('error', errorMessage);
        
        // Set field-specific errors if available
        if (result.data?.errors) {
          setProfileErrors(result.data.errors);
        }
      }
    } catch (error) {
      toast('error', t('common.failedToUpdateProfile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    try {
      setChangingPassword(true);
      const result = await api.changeInstructorPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (result.ok) {
        toast('success', t('common.passwordChanged'));
        // Clear password form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordErrors({});
      } else {
        const errorMessage = result.data?.message || t('common.failedToChangePassword');
        toast('error', errorMessage);
        
        // Set field-specific errors if available
        if (result.data?.errors) {
          setPasswordErrors(result.data.errors);
        } else if (errorMessage.toLowerCase().includes('current password') || errorMessage.toLowerCase().includes('fjalëkalimin aktual')) {
          setPasswordErrors({ currentPassword: errorMessage });
        }
      }
    } catch (error) {
      toast('error', t('common.failedToChangePassword'));
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('common.profileSettings')}</h1>
        <p className="text-gray-500 mt-1">{t('common.managePersonalData')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Profile Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('common.changeProfile')}</h2>
                <p className="text-sm text-gray-500">{t('common.updatePersonalData')}</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('common.firstName')}
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => {
                    setProfileData({ ...profileData, firstName: e.target.value });
                    if (profileErrors.firstName) {
                      setProfileErrors({ ...profileErrors, firstName: undefined });
                    }
                  }}
                  error={profileErrors.firstName}
                  required
                  autoComplete="given-name"
                />

                <Input
                  label={t('common.lastName')}
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => {
                    setProfileData({ ...profileData, lastName: e.target.value });
                    if (profileErrors.lastName) {
                      setProfileErrors({ ...profileErrors, lastName: undefined });
                    }
                  }}
                  error={profileErrors.lastName}
                  required
                  autoComplete="family-name"
                />
              </div>

              <Input
                label={t('common.email')}
                type="email"
                value={profileData.email}
                onChange={(e) => {
                  setProfileData({ ...profileData, email: e.target.value });
                  if (profileErrors.email) {
                    setProfileErrors({ ...profileErrors, email: undefined });
                  }
                }}
                error={profileErrors.email}
                required
                autoComplete="email"
              />

              <Input
                label={t('common.phone')}
                type="tel"
                value={profileData.phone}
                onChange={(e) => {
                  setProfileData({ ...profileData, phone: e.target.value });
                  if (profileErrors.phone) {
                    setProfileErrors({ ...profileErrors, phone: undefined });
                  }
                }}
                error={profileErrors.phone}
                required
                autoComplete="tel"
              />

              <Input
                label={t('common.address')}
                type="text"
                value={profileData.address}
                onChange={(e) => {
                  setProfileData({ ...profileData, address: e.target.value });
                  if (profileErrors.address) {
                    setProfileErrors({ ...profileErrors, address: undefined });
                  }
                }}
                error={profileErrors.address}
                required
                autoComplete="street-address"
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={savingProfile}
                  icon={<SaveIcon className="w-4 h-4" />}
                >
                  {savingProfile ? t('common.saving') : t('common.saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <LockIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('common.changePassword')}</h2>
                <p className="text-sm text-gray-500">{t('common.updateAccountPassword')}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label={t('common.currentPassword')}
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, currentPassword: e.target.value });
                  if (passwordErrors.currentPassword) {
                    setPasswordErrors({ ...passwordErrors, currentPassword: undefined });
                  }
                }}
                error={passwordErrors.currentPassword}
                required
                autoComplete="current-password"
              />

              <Input
                label={t('common.newPassword')}
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, newPassword: e.target.value });
                  if (passwordErrors.newPassword) {
                    setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                  }
                  // Clear confirm password error if passwords now match
                  if (passwordErrors.confirmPassword && e.target.value === passwordData.confirmPassword) {
                    setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                  }
                }}
                error={passwordErrors.newPassword}
                hint={t('common.passwordHint')}
                required
                autoComplete="new-password"
              />

              <Input
                label={t('common.confirmNewPassword')}
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                  }
                }}
                error={passwordErrors.confirmPassword}
                required
                autoComplete="new-password"
              />

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={changingPassword}
                  icon={<LockIcon className="w-4 h-4" />}
                >
                  {changingPassword ? t('common.changing') : t('common.changePassword')}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

