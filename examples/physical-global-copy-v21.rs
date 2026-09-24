//! Actual Rust source controls for the closed full-entry global copy.
//! Full-EXEC input reads occur before the authored output guard. Short output
//! views do not make a short/uninitialized input safe. No implicit setup/tail.
use fe2o3_device::{DisjointSlice, amdgpu_physical_global_copy, kernel};

#[kernel(typed, launch(required=[64,1,1], max=[64,1,1], max_grid=[2,1,1]))]
pub fn physical_global_copy_one(input: &[u32], output: DisjointSlice<u32>) {
    amdgpu_physical_global_copy! {
        gfx942_xnack_off_wave64;
        input=input; output=output;
        label(0);
        s_load_dwordx2(s_pair(8), kernarg, 0);
        s_load_dwordx2(s_pair(10), kernarg, 8);
        s_load_dwordx2(s_pair(12), kernarg, 16);
        s_load_dwordx2(s_pair(14), kernarg, 24);
        s_waitcnt_lgkmcnt0();
        s_lshl_b32(s(16), s(2), 6);
        v_add_u32_e32(v(2), s(16), v(0));
        v_mov_b32_e32(v(3), zero);
        v_mov_b32_e32(v(4), s(9));
        v_lshlrev_b64(v_pair(6), v_pair(2), 2);
        v_add_co_u32_e32(v(6), s(8), v(6));
        v_addc_co_u32_e32(v(7), v(4), v(7));
        global_load_dword(v(8), v_pair(6));
        s_waitcnt_vmcnt0();
        v_mov_b32_e32(v(5), s(13));
        v_lshlrev_b64(v_pair(10), v_pair(2), 2);
        v_add_co_u32_e32(v(10), s(12), v(10));
        v_addc_co_u32_e32(v(11), v(5), v(11));
        v_cmp_gt_u64_e32(s_pair(14), v_pair(2));
        s_and_saveexec_b64(s_pair(18));
        global_store_dword(v_pair(10), v(8));
        s_waitcnt_vmcnt0();
        s_mov_b64_exec(s_pair(18));
        s_endpgm0();
    }
}
