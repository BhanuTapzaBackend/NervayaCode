'use client';

import React from 'react';
import ReactPlayer from 'react-player';

type NativeReactPlayerProps = React.ComponentProps<typeof ReactPlayer>;

export type VideoPlayerProps = Omit<NativeReactPlayerProps, 'src'> & {
  url: string;
};

const VideoPlayer = (props: VideoPlayerProps) => {
  const { url, ...rest } = props;
  return <ReactPlayer src={url} {...rest} />;
};

export default VideoPlayer;
