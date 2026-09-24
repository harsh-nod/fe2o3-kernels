//! Complete physical scalar-fill source from compiler 90de8eaf2ef445e0d470793fb2a74169eec9175b.
//! This copy removes only the one-fixture feature gate. It is not a new production
//! execution, protected artifact or hardware qualification.
use fe2o3_device::{DisjointSlice, amdgpu_physical_entry, kernel};

#[kernel(typed, launch(required=[64,1,1], max=[64,1,1], max_grid=[2,1,1]))]
pub fn physical_one(output: DisjointSlice<u32>, a: u32, b: u32, c: u32, selector: u32) {
    amdgpu_physical_entry! {
        gfx942_xnack_off_wave64;
        output=output; a=a; b=b; c=c; selector=selector;
        label(250);
        s_load_dwordx2(s_pair(8), kernarg, 0);
        s_load_dwordx2(s_pair(10), kernarg, 8);
        s_load_dword(s(12), kernarg, 16);
        s_load_dword(s(13), kernarg, 20);
        s_load_dword(s(14), kernarg, 24);
        s_load_dword(s(15), kernarg, 28);
        s_waitcnt_lgkmcnt0();
        s_lshl_b32(s(16), s(2), 6);
        v_add_u32_e32(v(2), s(16), v(0));
        v_mov_b32_e32(v(3), zero);
        v_mov_b32_e32(v(4), s(9));
        v_mov_b32_e32(v(8), s(12));
        v_lshlrev_b64(v_pair(6), v_pair(2), 2);
        v_add_co_u32_e32(v(6), s(8), v(6));
        v_addc_co_u32_e32(v(7), v(4), v(7));
        v_cmp_gt_u64_e32(s_pair(10), v_pair(2));
        s_and_saveexec_b64(s_pair(18));
        global_store_dword(v_pair(6), v(8));
        s_waitcnt_vmcnt0();
        s_mov_b64_exec(s_pair(18));
        s_endpgm0();
    }
}
