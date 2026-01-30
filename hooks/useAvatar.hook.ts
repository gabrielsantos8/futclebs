import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { generateCroppedAvatar } from '../utils/avatar.utils';

export const useAvatar = (userId: string, onSuccess: () => void) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const avatarObjectUrlRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const cropBoxRef = useRef<HTMLDivElement | null>(null);

  const resetAvatarState = useCallback(() => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
    setAvatarFile(null);
    setAvatarSrc(null);
    setCropX(0);
    setCropY(0);
    setZoom(1);
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const selectFile = useCallback((file: File | null) => {
    if (!file) return;

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    avatarObjectUrlRef.current = url;
    setAvatarSrc(url);
    setCropX(0);
    setCropY(0);
    setZoom(1);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!avatarSrc) return;
    setIsDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, cx: cropX, cy: cropY };
  }, [avatarSrc, cropX, cropY]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setCropX(dragStartRef.current.cx + dx);
    setCropY(dragStartRef.current.cy + dy);
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const saveAvatar = useCallback(async () => {
    if (!avatarSrc || !cropBoxRef.current || uploading) return;

    setUploading(true);
    try {
      const boxSize = cropBoxRef.current.clientWidth;
      const base64 = await generateCroppedAvatar(avatarSrc, cropX, cropY, zoom, boxSize);

      if (!base64) throw new Error('Não foi possível gerar o avatar');

      const { error } = await supabase
        .from('players')
        .update({ avatar: base64 })
        .eq('id', userId);

      if (error) throw error;

      await onSuccess();
      resetAvatarState();
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [avatarSrc, cropX, cropY, zoom, uploading, userId, onSuccess, resetAvatarState]);

  const removeAvatar = useCallback(async () => {
    if (uploading) return;

    setUploading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .update({ avatar: null })
        .eq('id', userId)
        .select('id')
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('UPDATE não aplicado');
      }

      await onSuccess();
      resetAvatarState();
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [uploading, userId, onSuccess, resetAvatarState]);

  return {
    avatarFile,
    avatarSrc,
    cropX,
    cropY,
    zoom,
    isDragging,
    uploading,
    cropBoxRef,
    setZoom,
    resetAvatarState,
    selectFile,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    saveAvatar,
    removeAvatar
  };
};

