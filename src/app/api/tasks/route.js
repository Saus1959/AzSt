import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Task from "@/models/Task";
import Membership from "@/models/Membership";
import { getUser } from "@/lib/auth";
import { canSeeTask, isManager } from "@/lib/taskUtils";

export async function GET(req) {
  try {
    await dbConnect();
    const user = await getUser(req);
    const groupId = req.cookies.get("activeGroup")?.value;

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = groupId
      ? await Membership.findOne({ user: user._id, group: groupId }).lean()
      : null;

    // Достаем глобальные задачи и задачи текущей группы
    const query = groupId
      ? { $or: [{ group: null }, { group: groupId }] }
      : { group: null };
    const tasks = await Task.find(query)
      .populate("createdBy", "name surname")
      .populate("completedBy.user", "name surname")
      .sort({ createdAt: -1 })
      .lean();

    // Фильтруем то, что положено видеть юзеру
    const visibleTasks = tasks.filter((task) =>
      canSeeTask(
        task,
        user._id,
        groupId,
        membership || {},
        user.role === "admin",
      ),
    );

    return NextResponse.json(visibleTasks);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const user = await getUser(req);
    const body = await req.json();
    const groupId = req.cookies.get("activeGroup")?.value;

    const membership = groupId
      ? await Membership.findOne({ user: user._id, group: groupId }).lean()
      : null;
    const admin = user.role === "admin";

    if (!isManager(membership?.role, admin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Если админ делает GLOBAL задачу, group = null
    if (body.targetScope === "GLOBAL" && !admin) {
      return NextResponse.json(
        { error: "Only admins can create global tasks" },
        { status: 403 },
      );
    }

    const newTask = await Task.create({
      ...body,
      group: body.targetScope === "GLOBAL" ? null : groupId,
      createdBy: user._id,
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
