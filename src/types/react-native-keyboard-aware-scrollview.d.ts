declare module 'react-native-keyboard-aware-scrollview' {
  import { Component } from 'react';
  import { ScrollViewProps } from 'react-native';

  interface KeyboardAwareScrollViewProps extends ScrollViewProps {
    extraScrollHeight?: number;
    enableOnAndroid?: boolean;
    innerRef?: (ref: any) => void;
  }

  export class KeyboardAwareScrollView extends Component<KeyboardAwareScrollViewProps> {}
  export class KeyboardAwareListView extends Component<any> {}
}
