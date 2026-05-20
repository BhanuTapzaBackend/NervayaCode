export type ConfigPrimitive = string | number | boolean | null;

export type ConfigValue = ConfigPrimitive | ConfigValue[] | { [key: string]: ConfigValue };

export interface ISystemConfigValueMap {
  [key: string]: ConfigValue;
}

export interface ISystemConfig {
  _id: string;
  key: string;
  value: ConfigValue;
  description?: string;
  isPublic: boolean;
  updatedBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
