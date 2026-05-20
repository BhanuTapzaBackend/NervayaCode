'use client';

import React, { useState } from 'react';
import { SupplementFormData, AdditionalSection } from '@/types/supplement.types';
import { Input, Button } from '@/components/common';
import ImageUpload from '@/components/ImageUpload/ImageUpload';
import MultiImageUpload from '@/components/ImageUpload/MultiImageUpload';
import { Icon } from '@iconify/react';
import {
  ICON_PEN,
  ICON_WALLET,
  ICON_CLIPBOARD,
  ICON_CAMERA,
  ICON_INFO,
  ICON_TRASH,
  ICON_LOCATION,
} from '@/constants/icons';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import styles from './styles.module.css';
import NextImage from 'next/image';

interface SupplementFormProps {
  formData: SupplementFormData;
  setFormData: React.Dispatch<React.SetStateAction<SupplementFormData | null>>;
  onSubmit: () => void;
  initialData?: Partial<SupplementFormData>;
  loading?: boolean;
  submitLabel?: string;
}

const SupplementForm: React.FC<SupplementFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  loading = false,
  submitLabel = 'Create Supplement',
}) => {
  // Track the serialized formData arrays so we can detect external changes (e.g. Live Editor)
  // and reset local text state accordingly, using the React-recommended "store previous value in state" pattern.
  const ingredientsSerialized = formData.ingredients?.join(', ') || '';
  const benefitsSerialized = formData.benefits?.join(', ') || '';
  const [ingredientsText, setIngredientsText] = useState(ingredientsSerialized);
  const [benefitsText, setBenefitsText] = useState(benefitsSerialized);
  const [prevIngredients, setPrevIngredients] = useState(ingredientsSerialized);
  const [prevBenefits, setPrevBenefits] = useState(benefitsSerialized);
  const [priceText, setPriceText] = useState(String(formData.price));
  const [prevPrice, setPrevPrice] = useState(formData.price);
  const [imageUploading, setImageUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SupplementFormData, string>>>({});

  if (prevIngredients !== ingredientsSerialized) {
    setPrevIngredients(ingredientsSerialized);
    setIngredientsText(ingredientsSerialized);
  }
  if (prevBenefits !== benefitsSerialized) {
    setPrevBenefits(benefitsSerialized);
    setBenefitsText(benefitsSerialized);
  }
  if (prevPrice !== formData.price) {
    setPrevPrice(formData.price);
    setPriceText(String(formData.price));
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SupplementFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    if (formData.originalPrice != null && formData.originalPrice > 0 && formData.originalPrice < formData.price) {
      newErrors.originalPrice = 'Original price must exceed selling price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure priceText is flushed to formData (user may submit without blurring the price input)
    const parsedPrice = parseFloat(priceText) || 0;
    if (parsedPrice !== formData.price) {
      handleChange('price', parsedPrice);
    }
    if (!validate()) {
      return;
    }
    onSubmit();
  };

  const handleChange = (field: keyof SupplementFormData, value: SupplementFormData[keyof SupplementFormData]) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTextPadChange = (field: 'ingredients' | 'benefits', textValue: string) => {
    const arrayValue = textValue
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (field === 'ingredients') setIngredientsText(textValue);
    if (field === 'benefits') setBenefitsText(textValue);

    handleChange(field, arrayValue);
  };

  const handleAddSection = () => {
    const newSections = [...(formData.additionalSections || []), { title: 'New Section', content: [] }];
    handleChange('additionalSections', newSections);
  };

  const handleRemoveSection = (index: number) => {
    const newSections = (formData.additionalSections || []).filter((_, i) => i !== index);
    handleChange('additionalSections', newSections);
  };

  const handleSectionChange = (index: number, field: keyof AdditionalSection, value: string) => {
    const newSections = [...(formData.additionalSections || [])];
    if (field === 'content') {
      // Treat text pad as newline or comma separated
      const arrayValue = value
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean);
      newSections[index] = { ...newSections[index], content: arrayValue };
    } else {
      newSections[index] = { ...newSections[index], title: value };
    }
    handleChange('additionalSections', newSections);
  };

  const handleImageLoading = (isLoading: boolean) => {
    setImageUploading(isLoading);
  };

  return (
    <form onSubmit={handleFormSubmit} className={styles.form} noValidate>
      {/* ── Basic Information ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionIcon} ${styles.sectionIconInfo}`}>
            <Icon icon={ICON_PEN} width={18} height={18} />
          </div>
          <div>
            <h3 className={styles.sectionTitle}>Basic Information</h3>
            <p className={styles.sectionSubtitle}>Define the core identity of this supplement</p>
          </div>
        </div>
        <div className={styles.formGrid}>
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            required
            showRequiredIndicator
            labelIcon={
              <div className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>The official name of the product seen by customers</span>
              </div>
            }
          />
          <Input
            label="Short Description"
            value={formData.shortDescription || ''}
            onChange={(e) => handleChange('shortDescription', e.target.value)}
            placeholder="One-line tagline (e.g. For better sleep)"
            labelIcon={
              <div className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>Displayed under the product name on listing pages</span>
              </div>
            }
          />
          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <RichTextEditor
              label="Full Description"
              value={formData.description}
              onChange={(val) => handleChange('description', val)}
              placeholder="Provide a detailed description of the supplement..."
              required
            />
            {errors.description && <span className={styles.errorText}>{errors.description}</span>}
          </div>
        </div>
      </section>

      {/* ── Pricing & Inventory ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionIcon} ${styles.sectionIconPricing}`}>
            <Icon icon={ICON_WALLET} width={18} height={18} />
          </div>
          <div>
            <h3 className={styles.sectionTitle}>Pricing & Inventory</h3>
            <p className={styles.sectionSubtitle}>Manage costs and availability</p>
          </div>
        </div>
        <div className={`${styles.formGrid} ${styles.threeCol}`}>
          <Input
            label="Selling Price (₹)"
            type="number"
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            onBlur={() => handleChange('price', parseFloat(priceText) || 0)}
            error={errors.price}
            required
            min="0"
            step="0.01"
            labelIcon={
              <div className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>The final price customers will pay</span>
              </div>
            }
          />
          <Input
            label="Original Price (₹)"
            type="number"
            value={formData.originalPrice != null ? formData.originalPrice.toString() : ''}
            onChange={(e) => handleChange('originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
            error={errors.originalPrice}
            min="0"
            step="0.01"
            labelIcon={
              <div className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>Optional: Show a &quot;slashed&quot; price for discounts</span>
              </div>
            }
          />
          <Input
            label="Stock Quantity"
            type="number"
            value={formData.stock.toString()}
            onChange={(e) => handleChange('stock', parseInt(e.target.value, 10) || 0)}
            error={errors.stock}
            required
            min="0"
            labelIcon={
              <div className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>Total number of units available in warehouse</span>
              </div>
            }
          />
        </div>
      </section>

      {/* ── Details ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionIcon} ${styles.sectionIconDetails}`}>
            <Icon icon={ICON_CLIPBOARD} width={18} height={18} />
          </div>
          <div>
            <h3 className={styles.sectionTitle}>Product Details</h3>
            <p className={styles.sectionSubtitle}>Specific product attributes and instructions</p>
          </div>
        </div>
        <div className={styles.formGrid}>
          <Input
            label="Ingredients (Text Pad)"
            value={ingredientsText}
            onChange={(e) => handleTextPadChange('ingredients', e.target.value)}
            placeholder="e.g. Ashwagandha, Melatonin"
            labelIcon={
              <div className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>Comma-separated list of ingredients</span>
              </div>
            }
          />
          <Input
            label="Benefits (Text Pad)"
            value={benefitsText}
            onChange={(e) => handleTextPadChange('benefits', e.target.value)}
            placeholder="e.g. Calm mind, Better sleep"
            labelIcon={
              <div className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>Comma-separated list of key benefits</span>
              </div>
            }
          />
          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <label className={styles.label} htmlFor="supplement-suggestedUse">
              Suggested Use
              <div className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>How should customers use this product?</span>
              </div>
            </label>
            <textarea
              id="supplement-suggestedUse"
              className={styles.textarea}
              value={formData.suggestedUse || ''}
              onChange={(e) => handleChange('suggestedUse', e.target.value)}
              placeholder="e.g. Take 1-2 capsules 30 minutes before bed"
              rows={2}
            />
          </div>
          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <label className={styles.label} htmlFor="supplement-shippingAddress">
              <Icon icon={ICON_LOCATION} className={styles.labelIconSmall} /> Shipping Address
              <div className={styles.tooltipRoot}>
                <Icon icon={ICON_INFO} className={styles.infoIcon} />
                <span className={styles.tooltipText}>The physical address or origin for shipping this supplement</span>
              </div>
            </label>
            <textarea
              id="supplement-shippingAddress"
              className={styles.textarea}
              value={formData.shippingAddress || ''}
              onChange={(e) => handleChange('shippingAddress', e.target.value)}
              placeholder="e.g. Nervaya Warehouse, Bangalore"
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* ── Additional Sections ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div
            className={`${styles.sectionIcon} ${styles.sectionIconDetails}`}
            style={{ backgroundColor: 'var(--color-primary-100)' }}
          >
            <Icon
              icon="solar:checklist-minimalistic-bold"
              width={18}
              height={18}
              style={{ color: 'var(--color-primary-600)' }}
            />
          </div>
          <div className={styles.flexBetween}>
            <div>
              <h3 className={styles.sectionTitle}>Custom Sections</h3>
              <p className={styles.sectionSubtitle}>Add specialized headings like Safety, Usage, etc.</p>
            </div>
            <Button variant="secondary" onClick={handleAddSection} type="button">
              <Icon icon="solar:add-circle-bold" /> Add New Section
            </Button>
          </div>
        </div>

        <div className={styles.additionalSectionsList}>
          {formData.additionalSections?.map((section, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`form-section-${idx}-${section.title}`} className={styles.additionalSectionCard}>
              <div className={styles.sectionItemHeader}>
                <Input
                  label={`Section ${idx + 1} Heading`}
                  value={section.title}
                  onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                  className={styles.sectionTitleInput}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSection(idx)}
                  className={styles.removeSectionBtn}
                  title="Remove Section"
                >
                  <Icon icon={ICON_TRASH} />
                </button>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Section Content (Points - One per line)</label>
                <textarea
                  className={styles.textarea}
                  value={section.content.join('\n')}
                  onChange={(e) => handleSectionChange(idx, 'content', e.target.value)}
                  placeholder="Point 1&#10;Point 2..."
                  rows={3}
                />
              </div>
            </div>
          ))}
          {(!formData.additionalSections || formData.additionalSections.length === 0) && (
            <p className={styles.emptyState}>No custom sections added yet.</p>
          )}
        </div>
      </section>

      {/* ── Media & Visuals ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionIcon} ${styles.sectionIconMedia}`}>
            <Icon icon={ICON_CAMERA} width={18} height={18} />
          </div>
          <div>
            <h3 className={styles.sectionTitle}>Media & Visuals</h3>
            <p className={styles.sectionSubtitle}>Photos and gallery images</p>
          </div>
        </div>
        <div className={styles.mediaGrid}>
          <div className={styles.mediaPrimary}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Featured Image
                <div className={styles.tooltipRoot}>
                  <Icon icon={ICON_INFO} className={styles.infoIcon} />
                  <span className={styles.tooltipText}>Primary image shown on all listings</span>
                </div>
              </label>
              <ImageUpload
                onUpload={(url) => handleChange('image', url)}
                onLoadingChange={handleImageLoading}
                initialUrl={formData.image}
                label="Upload Photo"
                tone="light"
              />
            </div>
          </div>
          <div className={styles.mediaSecondary}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Gallery Images
                {(formData.images?.length ?? 0) > 0 && (
                  <span className={styles.countBadge}>({(formData.images ?? []).length} images)</span>
                )}
                <div className={styles.tooltipRoot}>
                  <Icon icon={ICON_INFO} className={styles.infoIcon} />
                  <span className={styles.tooltipText}>Upload multiple gallery images for the product</span>
                </div>
              </label>
              <MultiImageUpload
                urls={formData.images || []}
                onChange={(urls) => handleChange('images', urls)}
                label="Upload Gallery Images"
                tone="light"
                onLoadingChange={handleImageLoading}
                maxImages={5}
              />
              <p className={styles.fieldHint}>Ensure URLs end in .jpg, .png, .webp, or .avif</p>

              {/* Gallery Preview Grid */}
              {formData.images && formData.images.length > 0 && (
                <div className={styles.galleryPreviewGrid}>
                  {formData.images.map((url, idx) => (
                    <div key={`gallery-preview-${url}`} className={styles.galleryPreviewItem}>
                      <div className={styles.galleryPreviewThumbWrapper}>
                        <NextImage
                          src={url}
                          alt={`Gallery ${idx + 1}`}
                          fill
                          className={styles.galleryPreviewThumb}
                          unoptimized
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <div
          className={styles.toggleWrapper}
          onClick={() => handleChange('isActive', !formData.isActive)}
          role="switch"
          aria-checked={formData.isActive}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              handleChange('isActive', !formData.isActive);
            }
          }}
        >
          <div className={`${styles.toggleTrack} ${formData.isActive ? styles.toggleTrackActive : ''}`}>
            <div className={`${styles.toggleThumb} ${formData.isActive ? styles.toggleThumbActive : ''}`} />
          </div>
          <span className={styles.toggleLabel}>Visibility</span>
          <span
            className={`${styles.toggleStatus} ${formData.isActive ? styles.toggleStatusActive : styles.toggleStatusInactive}`}
          >
            {formData.isActive ? 'Active' : 'Hidden'}
          </span>
        </div>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={imageUploading}
          className={styles.submitButton}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default SupplementForm;
