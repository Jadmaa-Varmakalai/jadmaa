import React, { forwardRef } from 'react';
import {
  JadmaaVideoPlayer,
  type JadmaaVideoPlayerHandle,
  type JadmaaVideoPlayerProps,
} from '../player/JadmaaVideoPlayer';

export type CustomVideoPlayerHandle = JadmaaVideoPlayerHandle;
export type CustomCourseVideoPlayerProps = JadmaaVideoPlayerProps;

/**
 * CustomCourseVideoPlayer wraps the chromeless JadmaaVideoPlayer with
 * black-screen facade, YouTube chrome masking, and anti-piracy protections.
 */
export const CustomCourseVideoPlayer = forwardRef<
  CustomVideoPlayerHandle,
  CustomCourseVideoPlayerProps
>((props, ref) => {
  return <JadmaaVideoPlayer ref={ref} {...props} />;
});

CustomCourseVideoPlayer.displayName = 'CustomCourseVideoPlayer';

export default CustomCourseVideoPlayer;
