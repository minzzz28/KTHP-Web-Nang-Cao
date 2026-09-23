import { Button } from '../common/Button';
import { SelectInput, TextInput } from '../common/FormField';
import { prioritizeUniversities } from '../../utils/universities';

const AMENITY_OPTIONS = [
  ['wifi', 'Wifi'], ['air-conditioner', 'Điều hòa'], ['water-heater', 'Bình nóng lạnh'], ['private-bathroom', 'Vệ sinh riêng'],
  ['parking', 'Chỗ để xe'], ['kitchen', 'Bếp'], ['balcony', 'Ban công'], ['washing-machine', 'Máy giặt'], ['pet-friendly', 'Cho phép thú cưng'],
];

export function SearchFilters({ values, universities = [], primaryUniversity = null, universitiesLoading, onChange, onApply, onReset, closeLabel }) {
  const setValue = (field, value) => onChange({ ...values, [field]: value });
  const prioritizedUniversities = prioritizeUniversities(universities, primaryUniversity);
  const updateAmenity = (key, checked) => {
    const current = Array.isArray(values.amenitySlugs) ? values.amenitySlugs : [];
    const amenitySlugs = checked ? [...new Set([...current, key])] : current.filter((item) => item !== key);
    setValue('amenitySlugs', amenitySlugs);
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); onApply(); }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="filter-panel__heading mb-0">Bộ lọc</h2>
        <button type="button" className="btn btn-sm btn-link p-0" onClick={onReset}>Đặt lại</button>
      </div>
      <fieldset className="filter-group pt-0">
        <legend>Khoảng giá</legend>
        <div className="row g-2">
          <div className="col-6"><TextInput id="minPrice" label="Từ" inputMode="numeric" value={values.minPrice || ''} onChange={(event) => setValue('minPrice', event.target.value)} placeholder="0 đ" /></div>
          <div className="col-6"><TextInput id="maxPrice" label="Đến" inputMode="numeric" value={values.maxPrice || ''} onChange={(event) => setValue('maxPrice', event.target.value)} placeholder="Không giới hạn" /></div>
        </div>
      </fieldset>
      <fieldset className="filter-group">
        <legend>Vị trí & trường</legend>
        <TextInput id="district" label="Khu vực" value={values.district || ''} onChange={(event) => setValue('district', event.target.value)} placeholder="Ví dụ: Dương Nội hoặc Hà Đông" className="mb-3" />
        <SelectInput id="universityId" label="Gần trường" helpText={primaryUniversity ? 'Trường ưu tiên được chọn mặc định; bạn vẫn có thể chọn trường khác.' : undefined} value={values.universityId || ''} disabled={universitiesLoading} onChange={(event) => setValue('universityId', event.target.value)}>
          {primaryUniversity ? <option value={primaryUniversity.id}>{primaryUniversity.name} (mặc định)</option> : null}
          <option value="">Tất cả trường</option>
          {prioritizedUniversities.filter((university) => String(university.id) !== String(primaryUniversity?.id)).map((university) => <option value={university.id} key={university.id}>{university.name}</option>)}
        </SelectInput>
        <SelectInput id="radiusKm" label="Bán kính" value={values.radiusKm || '3'} onChange={(event) => setValue('radiusKm', event.target.value)} className="mt-3">
          <option value="1">1 km</option><option value="3">3 km</option><option value="5">5 km</option><option value="10">10 km</option>
        </SelectInput>
      </fieldset>
      <fieldset className="filter-group">
        <legend>Thông tin phòng</legend>
        <div className="row g-2">
          <div className="col-6"><TextInput id="minArea" label="Diện tích từ" inputMode="numeric" value={values.minArea || ''} onChange={(event) => setValue('minArea', event.target.value)} placeholder="m²" /></div>
          <div className="col-6"><TextInput id="minCapacity" label="Sức chứa từ" inputMode="numeric" value={values.minCapacity || ''} onChange={(event) => setValue('minCapacity', event.target.value)} placeholder="Số người" /></div>
        </div>
        <SelectInput id="type" label="Loại phòng" value={values.type || ''} onChange={(event) => setValue('type', event.target.value)} className="mt-3">
          <option value="">Tất cả loại phòng</option><option value="PRIVATE_ROOM">Phòng riêng</option><option value="SHARED_ROOM">Phòng ở ghép</option><option value="STUDIO">Studio</option><option value="APARTMENT">Căn hộ</option><option value="DORMITORY">Ký túc xá</option>
        </SelectInput>
      </fieldset>
      <fieldset className="filter-group">
        <legend>Tiện ích</legend>
        {AMENITY_OPTIONS.map(([key, label]) => <label className="form-check d-flex align-items-center gap-2 mb-2" key={key}><input className="form-check-input mt-0" type="checkbox" checked={values.amenitySlugs?.includes(key) || false} onChange={(event) => updateAmenity(key, event.target.checked)} /> <span className="small">{label}</span></label>)}
      </fieldset>
      <Button type="submit" className="w-100" icon="bi-funnel">Áp dụng bộ lọc{closeLabel ? ` và ${closeLabel}` : ''}</Button>
    </form>
  );
}
