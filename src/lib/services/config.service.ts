import SystemConfig from '@/lib/models/systemConfig.model';
import connectDB from '@/lib/db/mongodb';
import type { ConfigValue, ISystemConfigValueMap } from '@/types/systemConfig.types';

export const configService = {
  async get(key: string) {
    await connectDB();
    const config = await SystemConfig.findOne({ key });
    return config ? config.value : null;
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
      acc[config.key] = config.value;
      return acc;
    }, {});
  },

  async getAllConfigs() {
    await connectDB();
    return await SystemConfig.find({});
  },
};
