import { useState } from 'react';

export const useFormState = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isGoalkeeper, setIsGoalkeeper] = useState(false);

  const resetForm = () => {
    setPhone('');
    setPassword('');
    setName('');
    setIsGoalkeeper(false);
  };

  return {
    phone,
    setPhone,
    password,
    setPassword,
    name,
    setName,
    isGoalkeeper,
    setIsGoalkeeper,
    resetForm
  };
};

