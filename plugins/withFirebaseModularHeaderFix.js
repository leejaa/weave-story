// @react-native-firebase + `use_frameworks! :static` makes the RNFBApp framework
// include non-modular React-Core headers, which Xcode treats as an error under
// -Werror,-Wnon-modular-include-in-framework-module. The standard fix is to turn
// that warning off for all pod targets. CNG regenerates the Podfile on every
// prebuild, so we inject the post_install build setting via a config plugin.
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ANCHOR = 'post_install do |installer|\n';
const MARKER = 'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES';
const FIX = `    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        config.build_settings['CLANG_WARN_NON_MODULAR_INCLUDE_IN_FRAMEWORK_MODULE'] = 'NO'
        # Building React Native from source compiles bundled libfmt, whose consteval
        # format-string check fails under some Clang versions ("not a constant
        # expression"). Disabling FMT_USE_CONSTEVAL falls back to constexpr.
        defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
        defs = [defs] unless defs.is_a?(Array)
        defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs
      end
    end
`;

module.exports = function withFirebaseModularHeaderFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');
      if (contents.includes(ANCHOR) && !contents.includes(MARKER)) {
        contents = contents.replace(ANCHOR, ANCHOR + FIX);
        fs.writeFileSync(podfilePath, contents);
      }
      return cfg;
    },
  ]);
};
