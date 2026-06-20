import React from 'react';
import { Card } from '../../../components/ui/Card';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { useTheme, useThemeColors } from '../../../hooks/useTheme';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export const PreferencesView: React.FC = () => {
  const { theme, resolvedTheme } = useTheme();
  const colors = useThemeColors();

  const themeDescriptions = {
    light: 'Always use the light theme',
    dark: 'Always use the dark theme',
    system: 'Follow your system preference'
  };

  return (
    <div className="space-y-6">
      <Card variant="elevated" elevation={2}>
        <div style={{ padding: 0 }}>
          <h2 className="text-2xl font-semibold mb-4 text-title-large">Preferences</h2>
          <p className="mb-6 text-body-large" style={{ color: colors.onSurfaceVariant }}>
            Customize your application experience with Material Design theming.
          </p>

          {/* Theme Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-title-medium">Appearance</h3>
              
              {/* Current Theme Status */}
              <div 
                className="p-4 rounded-lg mb-6"
                style={{ backgroundColor: colors.surfaceContainer }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-body-large">Current Theme</p>
                    <p className="text-sm" style={{ color: colors.onSurfaceVariant }}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)} theme 
                      {theme === 'system' && ` (currently ${resolvedTheme})`}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {theme === 'light' && <SunIcon className="w-6 h-6" style={{ color: colors.primary }} />}
                    {theme === 'dark' && <MoonIcon className="w-6 h-6" style={{ color: colors.primary }} />}
                    {theme === 'system' && <ComputerDesktopIcon className="w-6 h-6" style={{ color: colors.primary }} />}
                  </div>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3 text-label-large">
                    Choose Theme Mode
                  </label>
                  <ThemeToggle variant="segmented" showSystemOption={true} />
                </div>

                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outline
                  }}
                >
                  <p className="text-sm font-medium mb-2 text-label-medium">About Theme Modes:</p>
                  <ul className="space-y-2 text-sm" style={{ color: colors.onSurfaceVariant }}>
                    <li className="flex items-start">
                      <SunIcon className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                      <span><strong>Light:</strong> {themeDescriptions.light}</span>
                    </li>
                    <li className="flex items-start">
                      <MoonIcon className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                      <span><strong>Dark:</strong> {themeDescriptions.dark}</span>
                    </li>
                    <li className="flex items-start">
                      <ComputerDesktopIcon className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                      <span><strong>System:</strong> {themeDescriptions.system}</span>
                    </li>
                  </ul>
                </div>

                {/* Material Design Information */}
                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    backgroundColor: colors.primaryContainer,
                  }}
                >
                  <h4 className="font-medium mb-2 text-label-large" style={{ color: colors.primary }}>
                    Material Design 3
                  </h4>
                  <p className="text-sm text-body-small" style={{ color: colors.onSurfaceVariant }}>
                    This application follows Material Design 3 principles for dark theme implementation, 
                    featuring proper elevation, surface colors, and accessibility standards.
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-body-small" style={{ color: colors.onSurfaceVariant }}>
                    <li>• Uses #121212 base surface color for optimal OLED support</li>
                    <li>• Implements proper elevation overlays for depth perception</li>
                    <li>• Maintains WCAG AA contrast standards (4.5:1 minimum)</li>
                    <li>• Features desaturated primary colors for better readability</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Typography Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-title-medium">Typography</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.surfaceContainer }}>
                  <div>
                    <p className="font-medium text-body-medium">Font Size</p>
                    <p className="text-sm" style={{ color: colors.onSurfaceVariant }}>
                      Adjust text size for better readability
                    </p>
                  </div>
                  <select 
                    className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                      color: colors.onSurface,
                    }}
                  >
                    <option>Small</option>
                    <option>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Preferences */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-title-medium">Accessibility</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.surfaceContainer }}>
                  <div>
                    <p className="font-medium text-body-medium">Reduce Motion</p>
                    <p className="text-sm" style={{ color: colors.onSurfaceVariant }}>
                      Minimize animations and transitions
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.surfaceContainer }}>
                  <div>
                    <p className="font-medium text-body-medium">High Contrast</p>
                    <p className="text-sm" style={{ color: colors.onSurfaceVariant }}>
                      Increase color contrast for better visibility
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Language Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-title-medium">Language & Region</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: colors.surfaceContainer }}>
                  <div>
                    <p className="font-medium text-body-medium">Language</p>
                    <p className="text-sm" style={{ color: colors.onSurfaceVariant }}>
                      Choose your preferred language
                    </p>
                  </div>
                  <select 
                    className="px-3 py-2 border rounded-lg text-sm"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                      color: colors.onSurface,
                    }}
                  >
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};