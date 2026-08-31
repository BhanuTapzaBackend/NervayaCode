import SystemConfig from '@/lib/models/systemConfig.model';
import connectDB from '@/lib/db/mongodb';
import type { ConfigValue, ISystemConfigValueMap } from '@/types/systemConfig.types';

export const configService = {
  async get(key: string): Promise<ConfigValue | null> {
    await connectDB();
    const config = await SystemConfig.findOne({ key });
    // Mixed in the schema, so the shape is only asserted at this boundary.
    // Callers must still narrow — a value saved as text stays text.
    return config ? (config.value as ConfigValue) : null;
  },

  async set(key: string, value: ConfigValue, updatedBy?: string, isPublic = false, description?: string) {
    await connectDB();
    return await SystemConfig.findOneAndUpdate(
      { key },
      { value, updatedBy, isPublic, description },
      { upsert: true, new: true },
    );
  },

  async getPublicConfigs() {
    await connectDB();
    const configs = await SystemConfig.find({ isPublic: true });
    return configs.reduce<ISystemConfigValueMap>((acc, config) => {
      acc[config.key] = config.value as ConfigValue;
      return acc;
    }, {});
  },

  async getAllConfigs() {
    await connectDB();
    return await SystemConfig.find({});
  },
};
