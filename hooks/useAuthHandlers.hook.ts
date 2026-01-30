import { useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Step } from '../types/app.types';
import { cleanPhone } from '../utils/phone.utils';
import { DEFAULT_OVERALL } from '../constants/app.constants';

export const useAuthHandlers = (
  loadUserData: (userId: string) => Promise<void>,
  setStep: (step: Step) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void
) => {
  const handleCheckPhone = useCallback(async (phone: string) => {
    const clean = cleanPhone(phone);
    if (clean.length < 10) {
      setError('Telefone inválido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase
        .from('players')
        .select('id')
        .eq('phone', clean)
        .maybeSingle();

      setStep(data ? Step.LOGIN : Step.REGISTER);
    } catch (err) {
      setError('Erro ao verificar telefone');
    } finally {
      setLoading(false);
    }
  }, [setStep, setError, setLoading]);

  const handleLogin = useCallback(async (phone: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        phone: `+55${cleanPhone(phone)}`,
        password
      });

      if (loginError) throw loginError;
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Senha incorreta' : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading]);

  const handleRegister = useCallback(async (
    phone: string,
    password: string,
    name: string,
    isGoalkeeper: boolean
  ) => {
    if (!name.trim()) {
      setError('Informe seu nome');
      return;
    }

    if (password.length < 6) {
      setError('Senha muito curta');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clean = cleanPhone(phone);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        phone: `+55${clean}`,
        password,
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Usuário não criado');

      const userId = signUpData.user.id;

      const { error: profileError } = await supabase.from('players').insert({
        id: userId,
        name: name.trim(),
        phone: clean,
        is_goalkeeper: isGoalkeeper,
        avatar: null,
      });

      if (profileError) throw profileError;

      const { error: statsError } = await supabase.from('player_stats').insert({
        player_id: userId,
        overall: DEFAULT_OVERALL
      });

      if (statsError) throw statsError;

      await loadUserData(userId);
      setStep(Step.PHONE_CHECK);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }, [loadUserData, setStep, setError, setLoading]);

  return {
    handleCheckPhone,
    handleLogin,
    handleRegister
  };
};

